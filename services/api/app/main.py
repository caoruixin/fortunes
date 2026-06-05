from __future__ import annotations

from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import UTC, datetime
import os
from typing import Annotated

from fastapi import Depends, FastAPI, Header, Query, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from services.api.app.dependencies import get_store
from services.api.app.errors import APIError, api_error_handler, http_error_handler, validation_error_handler
from services.api.app.middleware import RequestContextMiddleware
from services.api.app.schemas import (
    AcceptanceReport,
    AcceptanceRequest,
    DemoScene,
    DemoSceneFocus,
    DemoScript,
    Diagnosis,
    DiagnosisRequest,
    EmbeddedAcceptanceSummary,
    EmbeddedDiagnosisSummary,
    EmbeddedPlanSummary,
    ErrorDetail,
    ManholeDetail,
    ManholeListItem,
    ManholeListResponse,
    MapManholeFeature,
    MapManholeFeatureCollection,
    MapMeta,
    PageInfo,
    PipelineType,
    RepairPlan,
    PlanRequest,
    RiskDistributionItem,
    RiskLevel,
    Simulation,
    TopRiskItem,
    TrafficLevel,
    DashboardSummary,
    DashboardTotals,
    DiseaseLevel,
    ManholeStatus,
)
from services.api.app.store import IdempotencyRecord, RuntimeStore
from services.api.app.workflow import (
    build_acceptance_from_plan,
    build_diagnosis_from_inspection,
    build_plan_from_diagnosis,
    build_simulation_from_plan,
)


app = FastAPI(
    title="谛听监测管理平台 API",
    version="0.1.0",
    description="FastAPI backend for the 谛听管井及周边道路智能监测管理平台演示版.",
)

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://diting-platform.vercel.app",
    "https://fortunes-manhole-demo.vercel.app",
]
CORS_ALLOW_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=DEFAULT_CORS_ORIGINS + CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestContextMiddleware)
app.add_exception_handler(APIError, api_error_handler)
app.add_exception_handler(StarletteHTTPException, http_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.state.store = RuntimeStore()


def _etag(version: str) -> str:
    return f'W/"{version}"'


def _get_manhole(store: RuntimeStore, manhole_id: str) -> ManholeDetail:
    manhole = store.manholes.get(manhole_id)
    if manhole is None:
        raise APIError(status_code=404, code="MANHOLE_NOT_FOUND", message=f"Manhole {manhole_id} was not found.")
    return manhole


def _parse_include(include: str | None) -> set[str]:
    if not include:
        return set()
    return {item.strip() for item in include.split(",") if item.strip()}


def _serialize_diagnosis_summary(diagnosis: Diagnosis) -> EmbeddedDiagnosisSummary:
    return EmbeddedDiagnosisSummary(
        diagnosisVersion=diagnosis.diagnosisVersion,
        generatedAt=diagnosis.generatedAt,
        riskScore=diagnosis.riskScore,
        riskLevel=diagnosis.riskLevel,
        diseaseLevel=diagnosis.diseaseLevel,
    )


def _serialize_plan_summary(plan: RepairPlan) -> EmbeddedPlanSummary:
    return EmbeddedPlanSummary(
        planVersion=plan.planVersion,
        recommendedMethod=plan.recommendedMethod,
        estimatedDurationMinutes=plan.estimatedDurationMinutes,
        openTrafficHours=plan.openTrafficHours,
    )


def _serialize_list_item(item: ManholeDetail) -> ManholeListItem:
    return ManholeListItem(
        id=item.id,
        code=item.code,
        projectId=item.projectId,
        roadId=item.roadId,
        roadName=item.roadName,
        location=item.location,
        manholeType=item.manholeType,
        pipelineType=item.pipelineType,
        trafficLevel=item.trafficLevel,
        status=item.status,
        riskScore=item.riskScore,
        riskLevel=item.riskLevel,
        diseaseLevel=item.diseaseLevel,
        lastInspectionAt=item.lastInspectionAt,
        lastRepairAt=item.lastRepairAt,
        repairCount=item.repairCount,
    )


def _encode_page_token(offset: int) -> str:
    return urlsafe_b64encode(str(offset).encode("utf-8")).decode("utf-8")


def _decode_page_token(page_token: str | None) -> int:
    if not page_token:
        return 0
    try:
        return int(urlsafe_b64decode(page_token.encode("utf-8")).decode("utf-8"))
    except Exception as exc:  # pragma: no cover - defensive
        raise APIError(
            status_code=400,
            code="FILTER_INVALID",
            message="pageToken is invalid.",
            details=[ErrorDetail(field="pageToken", issue="invalid_token")],
        ) from exc


def _apply_idempotency(
    store: RuntimeStore,
    *,
    endpoint_path: str,
    idempotency_key: str | None,
    payload: dict,
) -> tuple[IdempotencyRecord | None, str | None]:
    if not idempotency_key:
        return None, None
    payload_hash = store.payload_hash(payload)
    record = store.idempotency_records.get((endpoint_path, idempotency_key))
    if record is None:
        return None, payload_hash
    if record.payload_hash != payload_hash:
        raise APIError(
            status_code=409,
            code="IDEMPOTENCY_KEY_REUSED",
            message="The idempotency key has already been used with a different payload.",
        )
    return record, payload_hash


def _store_idempotent_response(
    store: RuntimeStore,
    *,
    endpoint_path: str,
    idempotency_key: str | None,
    payload_hash: str | None,
    status_code: int,
    body: dict,
) -> None:
    if not idempotency_key or not payload_hash:
        return
    store.idempotency_records[(endpoint_path, idempotency_key)] = IdempotencyRecord(
        payload_hash=payload_hash,
        status_code=status_code,
        body=body,
    )


def _ensure_latest_version(field: str, supplied: str, current: str, manhole_id: str, resource_name: str) -> None:
    if supplied != current:
        raise APIError(
            status_code=409,
            code="CONFLICTING_SOURCE_VERSION",
            message=f"{resource_name} version {supplied} is not the latest available version for manhole {manhole_id}.",
            details=[ErrorDetail(field=field, issue="stale_version", currentVersion=current)],
        )


@app.get("/api/v1/dashboard/summary", response_model=DashboardSummary, tags=["Dashboard"])
def get_dashboard_summary(
    store: Annotated[RuntimeStore, Depends(get_store)],
    project_id: Annotated[str | None, Query(alias="projectId")] = None,
    road_id: Annotated[str | None, Query(alias="roadId")] = None,
    updated_since: Annotated[datetime | None, Query(alias="updatedSince")] = None,
) -> DashboardSummary:
    manholes = list(store.manholes.values())
    if project_id:
        manholes = [item for item in manholes if item.projectId == project_id]
    if road_id:
        manholes = [item for item in manholes if item.roadId == road_id]
    if updated_since:
        manholes = [item for item in manholes if item.lastInspectionAt >= updated_since]
    distribution = [RiskDistributionItem(riskLevel=level, count=0) for level in RiskLevel]
    counts = {level: 0 for level in RiskLevel}
    for manhole in manholes:
        counts[manhole.riskLevel] += 1
    distribution = [RiskDistributionItem(riskLevel=level, count=counts[level]) for level in RiskLevel]
    top_risks = sorted(manholes, key=lambda item: item.riskScore, reverse=True)[:5]
    return DashboardSummary(
        projectId=project_id or "demo-city-sha-001",
        generatedAt=datetime.now(UTC),
        totals=DashboardTotals(
            manholes=len(manholes),
            highRiskManholes=sum(1 for item in manholes if item.riskLevel in {RiskLevel.high, RiskLevel.critical}),
            diagnosedManholes=sum(1 for item in manholes if item.id in store.diagnoses),
            plannedManholes=sum(1 for item in manholes if item.id in store.plans),
            acceptedManholes=sum(1 for item in manholes if item.id in store.acceptances),
        ),
        riskDistribution=distribution,
        topRisks=[
            TopRiskItem(
                manholeId=item.id,
                code=item.code,
                roadName=item.roadName,
                riskScore=item.riskScore,
                riskLevel=item.riskLevel,
            )
            for item in top_risks
        ],
    )


@app.get("/api/v1/map/manholes", response_model=MapManholeFeatureCollection, tags=["Map"])
def get_map_manholes(
    store: Annotated[RuntimeStore, Depends(get_store)],
    bbox: str | None = None,
    risk_level: Annotated[RiskLevel | None, Query(alias="riskLevel")] = None,
    pipeline_type: Annotated[PipelineType | None, Query(alias="pipelineType")] = None,
    traffic_level: Annotated[TrafficLevel | None, Query(alias="trafficLevel")] = None,
    has_diagnosis: Annotated[bool | None, Query(alias="hasDiagnosis")] = None,
    limit: int = Query(default=500, ge=1, le=1000),
) -> MapManholeFeatureCollection:
    manholes = list(store.manholes.values())
    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = [float(part) for part in bbox.split(",")]
        except ValueError as exc:
            raise APIError(
                status_code=400,
                code="FILTER_INVALID",
                message="bbox must contain four comma-separated numbers.",
                details=[ErrorDetail(field="bbox", issue="invalid_bbox")],
            ) from exc
        manholes = [
            item
            for item in manholes
            if min_lon <= item.location.lon <= max_lon and min_lat <= item.location.lat <= max_lat
        ]
    if risk_level:
        manholes = [item for item in manholes if item.riskLevel == risk_level]
    if pipeline_type:
        manholes = [item for item in manholes if item.pipelineType == pipeline_type]
    if traffic_level:
        manholes = [item for item in manholes if item.trafficLevel == traffic_level]
    if has_diagnosis is not None:
        manholes = [item for item in manholes if (item.id in store.diagnoses) is has_diagnosis]
    features = [
        MapManholeFeature(
            id=item.id,
            code=item.code,
            riskScore=item.riskScore,
            riskLevel=item.riskLevel,
            diseaseLevel=item.diseaseLevel,
            roadName=item.roadName,
            district=item.district,
            pipelineType=item.pipelineType,
            trafficLevel=item.trafficLevel,
            status=item.status,
            hasDiagnosis=item.id in store.diagnoses,
            hasPlan=item.id in store.plans,
            hasAcceptance=item.id in store.acceptances,
            location=item.location,
        )
        for item in manholes[:limit]
    ]
    return MapManholeFeatureCollection(features=features, meta=MapMeta(count=len(features), limit=limit))


@app.get("/api/v1/manholes", response_model=ManholeListResponse, tags=["Manholes"])
def list_manholes(
    store: Annotated[RuntimeStore, Depends(get_store)],
    project_id: Annotated[str | None, Query(alias="projectId")] = None,
    road_id: Annotated[str | None, Query(alias="roadId")] = None,
    risk_level: Annotated[RiskLevel | None, Query(alias="riskLevel")] = None,
    disease_level: Annotated[DiseaseLevel | None, Query(alias="diseaseLevel")] = None,
    pipeline_type: Annotated[PipelineType | None, Query(alias="pipelineType")] = None,
    traffic_level: Annotated[TrafficLevel | None, Query(alias="trafficLevel")] = None,
    status_filter: Annotated[ManholeStatus | None, Query(alias="status")] = None,
    sort: str = "riskScore:desc,lastInspectionAt:desc",
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
    page_token: Annotated[str | None, Query(alias="pageToken")] = None,
) -> ManholeListResponse:
    items = list(store.manholes.values())
    if project_id:
        items = [item for item in items if item.projectId == project_id]
    if road_id:
        items = [item for item in items if item.roadId == road_id]
    if risk_level:
        items = [item for item in items if item.riskLevel == risk_level]
    if disease_level:
        items = [item for item in items if item.diseaseLevel == disease_level]
    if pipeline_type:
        items = [item for item in items if item.pipelineType == pipeline_type]
    if traffic_level:
        items = [item for item in items if item.trafficLevel == traffic_level]
    if status_filter:
        items = [item for item in items if item.status == status_filter]

    sort_parts = [part.strip() for part in sort.split(",") if part.strip()]
    for part in reversed(sort_parts):
        try:
            field, direction = part.split(":")
        except ValueError as exc:
            raise APIError(
                status_code=400,
                code="FILTER_INVALID",
                message="sort must use field:direction segments.",
                details=[ErrorDetail(field="sort", issue="invalid_sort")],
            ) from exc
        reverse = direction == "desc"
        items.sort(key=lambda item: getattr(item, field), reverse=reverse)

    offset = _decode_page_token(page_token)
    page_items = items[offset : offset + page_size]
    next_offset = offset + page_size
    next_page_token = _encode_page_token(next_offset) if next_offset < len(items) else None

    return ManholeListResponse(
        items=[_serialize_list_item(item) for item in page_items],
        page=PageInfo(pageSize=page_size, nextPageToken=next_page_token),
    )


@app.get("/api/v1/manholes/{manhole_id}", response_model=ManholeDetail, tags=["Manholes"])
def get_manhole(
    response: Response,
    store: Annotated[RuntimeStore, Depends(get_store)],
    manhole_id: str,
    include: str | None = None,
) -> ManholeDetail:
    manhole = _get_manhole(store, manhole_id)
    included = _parse_include(include)
    payload = ManholeDetail.model_validate(manhole.model_dump())
    if "diagnosis" in included and manhole_id in store.diagnoses:
        payload.diagnosis = _serialize_diagnosis_summary(store.diagnoses[manhole_id])
    if "plan" in included and manhole_id in store.plans:
        payload.plan = _serialize_plan_summary(store.plans[manhole_id])
    if "acceptance" in included and manhole_id in store.acceptances:
        acceptance = store.acceptances[manhole_id]
        payload.acceptance = EmbeddedAcceptanceSummary(
            acceptanceVersion=acceptance.acceptanceVersion,
            generatedAt=acceptance.generatedAt,
            conclusion=acceptance.conclusion,
        )
    response.headers["ETag"] = _etag(manhole.latestInspection.inspectionVersion)
    return payload


@app.get("/api/v1/manholes/{manhole_id}/diagnosis", response_model=Diagnosis, tags=["Diagnosis"])
def get_diagnosis(response: Response, store: Annotated[RuntimeStore, Depends(get_store)], manhole_id: str) -> Diagnosis:
    _get_manhole(store, manhole_id)
    diagnosis = store.diagnoses.get(manhole_id)
    if diagnosis is None:
        raise APIError(status_code=404, code="DIAGNOSIS_NOT_FOUND", message=f"Diagnosis for {manhole_id} was not found.")
    response.headers["ETag"] = _etag(diagnosis.diagnosisVersion)
    return diagnosis


@app.post("/api/v1/manholes/{manhole_id}/diagnosis", response_model=Diagnosis, tags=["Diagnosis"])
def generate_diagnosis(
    request: Request,
    store: Annotated[RuntimeStore, Depends(get_store)],
    manhole_id: str,
    body: DiagnosisRequest,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> JSONResponse:
    manhole = _get_manhole(store, manhole_id)
    record, payload_hash = _apply_idempotency(
        store,
        endpoint_path=request.url.path,
        idempotency_key=idempotency_key,
        payload=body.model_dump(mode="json"),
    )
    if record:
        return JSONResponse(status_code=record.status_code, content=record.body, headers={"X-Request-Id": request.state.request_id})

    inspection_version = body.inspectionVersion or manhole.latestInspection.inspectionVersion
    _ensure_latest_version(
        "inspectionVersion",
        inspection_version,
        manhole.latestInspection.inspectionVersion,
        manhole_id,
        "Inspection",
    )
    existing = store.diagnoses.get(manhole_id)
    if existing and existing.inspectionVersion == inspection_version and body.generationMode.value == "reuse_if_unchanged":
        reused = existing.model_copy(update={"generationStatus": "reused"})
        payload = reused.model_dump(mode="json")
        _store_idempotent_response(
            store,
            endpoint_path=request.url.path,
            idempotency_key=idempotency_key,
            payload_hash=payload_hash,
            status_code=200,
            body=payload,
        )
        return JSONResponse(status_code=200, content=payload, headers={"X-Request-Id": request.state.request_id})

    revision = 1
    generation_status = "created"
    if existing is not None:
        revision = int(existing.diagnosisVersion.rsplit("r", 1)[-1]) + 1
        generation_status = "recomputed"
    diagnosis = build_diagnosis_from_inspection(
        manhole,
        inspection_version,
        revision=revision,
        generation_status=generation_status,
    )
    store.diagnoses[manhole_id] = diagnosis
    store.refresh_status(manhole_id)
    payload = diagnosis.model_dump(mode="json")
    status_code = status.HTTP_201_CREATED if generation_status == "created" else status.HTTP_200_OK
    _store_idempotent_response(
        store,
        endpoint_path=request.url.path,
        idempotency_key=idempotency_key,
        payload_hash=payload_hash,
        status_code=status_code,
        body=payload,
    )
    return JSONResponse(status_code=status_code, content=payload, headers={"X-Request-Id": request.state.request_id})


@app.get("/api/v1/manholes/{manhole_id}/plan", response_model=RepairPlan, tags=["Plan"])
def get_plan(response: Response, store: Annotated[RuntimeStore, Depends(get_store)], manhole_id: str) -> RepairPlan:
    _get_manhole(store, manhole_id)
    plan = store.plans.get(manhole_id)
    if plan is None:
        raise APIError(status_code=404, code="PLAN_NOT_FOUND", message=f"Repair plan for {manhole_id} was not found.")
    response.headers["ETag"] = _etag(plan.planVersion)
    return plan


@app.post("/api/v1/manholes/{manhole_id}/plan", response_model=RepairPlan, tags=["Plan"])
def generate_plan(
    request: Request,
    store: Annotated[RuntimeStore, Depends(get_store)],
    manhole_id: str,
    body: PlanRequest,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> JSONResponse:
    _get_manhole(store, manhole_id)
    record, payload_hash = _apply_idempotency(
        store,
        endpoint_path=request.url.path,
        idempotency_key=idempotency_key,
        payload=body.model_dump(mode="json"),
    )
    if record:
        return JSONResponse(status_code=record.status_code, content=record.body, headers={"X-Request-Id": request.state.request_id})

    diagnosis = store.diagnoses.get(manhole_id)
    if diagnosis is None:
        raise APIError(
            status_code=409,
            code="PRECONDITION_REQUIRED",
            message="Repair plan cannot be generated before a diagnosis exists.",
            details=[ErrorDetail(field="diagnosisVersion", issue="missing_dependency", dependency="diagnosis")],
        )
    diagnosis_version = body.diagnosisVersion or diagnosis.diagnosisVersion
    _ensure_latest_version("diagnosisVersion", diagnosis_version, diagnosis.diagnosisVersion, manhole_id, "Diagnosis")

    existing = store.plans.get(manhole_id)
    if existing and existing.diagnosisVersion == diagnosis_version and body.generationMode.value == "reuse_if_unchanged":
        reused = existing.model_copy(update={"generationStatus": "reused"})
        payload = reused.model_dump(mode="json")
        _store_idempotent_response(
            store,
            endpoint_path=request.url.path,
            idempotency_key=idempotency_key,
            payload_hash=payload_hash,
            status_code=200,
            body=payload,
        )
        return JSONResponse(status_code=200, content=payload, headers={"X-Request-Id": request.state.request_id})

    revision = 1
    generation_status = "created"
    if existing is not None:
        revision = int(existing.planVersion.rsplit("r", 1)[-1]) + 1
        generation_status = "recomputed"
    plan = build_plan_from_diagnosis(_get_manhole(store, manhole_id), diagnosis, revision=revision, generation_status=generation_status)
    store.plans[manhole_id] = plan
    store.refresh_status(manhole_id)
    payload = plan.model_dump(mode="json")
    status_code = status.HTTP_201_CREATED if generation_status == "created" else status.HTTP_200_OK
    _store_idempotent_response(
        store,
        endpoint_path=request.url.path,
        idempotency_key=idempotency_key,
        payload_hash=payload_hash,
        status_code=status_code,
        body=payload,
    )
    return JSONResponse(status_code=status_code, content=payload, headers={"X-Request-Id": request.state.request_id})


@app.get("/api/v1/manholes/{manhole_id}/simulation", response_model=Simulation, tags=["Simulation"])
def get_simulation(
    store: Annotated[RuntimeStore, Depends(get_store)],
    manhole_id: str,
    plan_version: Annotated[str | None, Query(alias="planVersion")] = None,
) -> Simulation:
    manhole = _get_manhole(store, manhole_id)
    plan = store.plans.get(manhole_id)
    if plan is None:
        raise APIError(
            status_code=409,
            code="PRECONDITION_REQUIRED",
            message="Simulation is unavailable until a repair plan exists.",
            details=[ErrorDetail(field="planVersion", issue="missing_dependency", dependency="plan")],
        )
    if plan_version:
        _ensure_latest_version("planVersion", plan_version, plan.planVersion, manhole_id, "Plan")
    return build_simulation_from_plan(manhole, plan)


@app.get("/api/v1/manholes/{manhole_id}/acceptance", response_model=AcceptanceReport, tags=["Acceptance"])
def get_acceptance(
    response: Response,
    store: Annotated[RuntimeStore, Depends(get_store)],
    manhole_id: str,
):
    _get_manhole(store, manhole_id)
    acceptance = store.acceptances.get(manhole_id)
    if acceptance is None:
        raise APIError(
            status_code=404,
            code="ACCEPTANCE_NOT_FOUND",
            message=f"Acceptance report for {manhole_id} was not found.",
        )
    response.headers["ETag"] = _etag(acceptance.acceptanceVersion)
    return acceptance


@app.post("/api/v1/manholes/{manhole_id}/acceptance", response_model=AcceptanceReport, tags=["Acceptance"])
def generate_acceptance(
    request: Request,
    store: Annotated[RuntimeStore, Depends(get_store)],
    manhole_id: str,
    body: AcceptanceRequest,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> JSONResponse:
    _get_manhole(store, manhole_id)
    record, payload_hash = _apply_idempotency(
        store,
        endpoint_path=request.url.path,
        idempotency_key=idempotency_key,
        payload=body.model_dump(mode="json"),
    )
    if record:
        return JSONResponse(status_code=record.status_code, content=record.body, headers={"X-Request-Id": request.state.request_id})

    diagnosis = store.diagnoses.get(manhole_id)
    plan = store.plans.get(manhole_id)
    if plan is None or diagnosis is None:
        raise APIError(
            status_code=409,
            code="PRECONDITION_REQUIRED",
            message="Acceptance report cannot be generated before a repair plan exists.",
            details=[ErrorDetail(field="planVersion", issue="missing_dependency", dependency="plan")],
        )
    plan_version = body.planVersion or plan.planVersion
    _ensure_latest_version("planVersion", plan_version, plan.planVersion, manhole_id, "Plan")

    existing = store.acceptances.get(manhole_id)
    if existing and existing.planVersion == plan_version:
        payload = existing.model_dump(mode="json")
        _store_idempotent_response(
            store,
            endpoint_path=request.url.path,
            idempotency_key=idempotency_key,
            payload_hash=payload_hash,
            status_code=200,
            body=payload,
        )
        return JSONResponse(status_code=200, content=payload, headers={"X-Request-Id": request.state.request_id})

    revision = 1 if existing is None else int(existing.acceptanceVersion.rsplit("r", 1)[-1]) + 1
    report = build_acceptance_from_plan(_get_manhole(store, manhole_id), diagnosis, plan, revision=revision)
    store.acceptances[manhole_id] = report
    store.refresh_status(manhole_id)
    payload = report.model_dump(mode="json")
    _store_idempotent_response(
        store,
        endpoint_path=request.url.path,
        idempotency_key=idempotency_key,
        payload_hash=payload_hash,
        status_code=201,
        body=payload,
    )
    return JSONResponse(status_code=201, content=payload, headers={"X-Request-Id": request.state.request_id})


@app.get("/api/v1/demo-script", response_model=DemoScript, tags=["Demo Script"])
def get_demo_script(script_id: str = "default", audience: str = "executive") -> DemoScript:
    if script_id != "default":
        raise APIError(status_code=404, code="SCRIPT_NOT_FOUND", message=f"Demo script {script_id} was not found.")
    if audience not in {"executive", "technical"}:
        raise APIError(
            status_code=400,
            code="FILTER_INVALID",
            message="audience must be executive or technical.",
            details=[ErrorDetail(field="audience", issue="invalid_choice")],
        )
    manhole_id = "mh-0007"
    narration = {
        "executive": [
            "我们先从城市道路风险地图看到高风险资产，再聚焦这座红色检查井。",
            "系统把地下不可见病害转成了等级、深度和热力图。",
            "随后自动生成微创修复方案，并给出 2 小时开放交通目标。",
            "最后用一井一档验收报告量化修复效果。",
        ],
        "technical": [
            "地图点位按风险分层，当前聚焦 C 级示范井。",
            "诊断结果展示局部脱空、基层松散和井座松动风险。",
            "方案页给出孔位、浆量、材料和施工时长。",
            "验收报告记录平整度、噪音和复检建议。",
        ],
    }[audience]
    return DemoScript(
        scriptId=script_id,
        audience=audience,
        title="谛听监测管理平台演示脚本",
        manholeId=manhole_id,
        scenes=[
            DemoScene(
                sceneCode="map_intro",
                sequence=1,
                route="/map",
                title="城市道路风险地图",
                narration=narration[0],
                focus=DemoSceneFocus(manholeId=manhole_id),
            ),
            DemoScene(
                sceneCode="diagnosis_result",
                sequence=2,
                route=f"/manholes/{manhole_id}/diagnosis",
                title="AI 诊断结果",
                narration=narration[1],
            ),
            DemoScene(
                sceneCode="plan_review",
                sequence=3,
                route=f"/manholes/{manhole_id}/plan",
                title="维修方案",
                narration=narration[2],
            ),
            DemoScene(
                sceneCode="acceptance_report",
                sequence=4,
                route=f"/manholes/{manhole_id}/acceptance",
                title="验收报告",
                narration=narration[3],
            ),
        ],
    )


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "谛听监测管理平台 API", "docs": "/docs", "openapi": "/openapi.json"}
