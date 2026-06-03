from __future__ import annotations

from fastapi import Request

from services.api.app.store import RuntimeStore


def get_store(request: Request) -> RuntimeStore:
    return request.app.state.store

