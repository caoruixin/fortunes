from __future__ import annotations

from dataclasses import dataclass, field

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from services.api.app.schemas import ErrorBody, ErrorDetail, ErrorResponse


@dataclass
class APIError(Exception):
    status_code: int
    code: str
    message: str
    details: list[ErrorDetail] = field(default_factory=list)


def correlation_id_from_request(request: Request) -> str:
    return getattr(request.state, "request_id", "req_unknown")


def build_error_response(
    request: Request,
    *,
    status_code: int,
    code: str,
    message: str,
    details: list[ErrorDetail] | None = None,
) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorBody(
            code=code,
            message=message,
            details=details or [],
            correlationId=correlation_id_from_request(request),
        )
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump(mode="json"))


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    return build_error_response(
        request,
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
    )


async def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return build_error_response(
        request,
        status_code=exc.status_code,
        code="HTTP_ERROR",
        message=str(exc.detail),
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    body_error = any(error["loc"] and error["loc"][0] == "body" for error in exc.errors())
    details = [
        ErrorDetail(
            field=".".join(str(part) for part in error["loc"][1:]) or "request",
            issue=error["type"],
        )
        for error in exc.errors()
    ]
    if body_error:
        return build_error_response(
            request,
            status_code=422,
            code="UNPROCESSABLE_INPUT",
            message="Request body could not be processed.",
            details=details,
        )
    return build_error_response(
        request,
        status_code=400,
        code="FILTER_INVALID",
        message="Request parameters are invalid.",
        details=details,
    )

