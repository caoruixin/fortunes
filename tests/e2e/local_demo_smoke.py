#!/usr/bin/env python3
"""Lightweight local smoke validation for the manhole MVP demo."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any


WEB_BASE_URL = os.getenv("WEB_BASE_URL", "http://127.0.0.1:3001").rstrip("/")
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
API_PREFIX = f"{API_BASE_URL}/api/v1"
TIMEOUT_SECONDS = float(os.getenv("SMOKE_TIMEOUT_SECONDS", "10"))


class SmokeFailure(RuntimeError):
    pass


@dataclass
class CheckResult:
    name: str
    details: str


def http_request(method: str, url: str, payload: dict[str, Any] | None = None) -> tuple[int, Any]:
    data = None
    headers = {"Accept": "application/json, text/html;q=0.9, */*;q=0.8"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url=url, method=method, data=data, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            body = response.read()
            content_type = response.headers.get("Content-Type", "")
            if "json" in content_type:
                try:
                    return response.status, json.loads(body.decode("utf-8"))
                except json.JSONDecodeError as exc:
                    raise SmokeFailure(f"invalid JSON from {url}: {exc}") from exc
            return response.status, body.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SmokeFailure(f"{method} {url} -> HTTP {exc.code}: {body[:300]}") from exc
    except urllib.error.URLError as exc:
        raise SmokeFailure(f"{method} {url} -> connection failed: {exc.reason}") from exc


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SmokeFailure(message)


def extract_candidates(payload: Any) -> list[Any]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("items", "data", "results", "features", "manholes"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
        if payload.get("type") == "FeatureCollection" and isinstance(payload.get("features"), list):
            return payload["features"]
    raise SmokeFailure("unable to locate a list payload in map/list response")


def get_field(item: dict[str, Any], *names: str) -> Any:
    for name in names:
        if name in item:
            return item[name]
    return None


def feature_properties(item: Any) -> dict[str, Any]:
    if isinstance(item, dict) and isinstance(item.get("properties"), dict):
        merged = dict(item["properties"])
        if "id" not in merged and item.get("id") is not None:
            merged["id"] = item["id"]
        return merged
    if isinstance(item, dict):
        return item
    raise SmokeFailure("map feature is not an object")


def risk_rank(item: dict[str, Any]) -> int:
    risk_level = str(get_field(item, "riskLevel", "risk_level", "risk") or "").lower()
    disease_grade = str(get_field(item, "diseaseLevel", "diseaseGrade", "disease_grade") or "").upper()
    risk_score = get_field(item, "riskScore", "risk_score") or 0

    if risk_level in {"critical", "high"}:
        return 100
    if disease_grade == "D":
        return 95
    if disease_grade == "C":
        return 85
    if isinstance(risk_score, (int, float)):
        return int(risk_score)
    return 0


def pick_demo_manhole(features: list[Any]) -> dict[str, Any]:
    candidates = [feature_properties(item) for item in features]
    for item in candidates:
        if item.get("id") == "mh-0007":
            return item
    for item in candidates:
        if str(get_field(item, "diseaseLevel", "diseaseGrade", "disease_grade") or "").upper() == "C":
            return item
    ranked = sorted(candidates, key=risk_rank, reverse=True)
    ensure(bool(ranked), "map/list returned no manholes")
    choice = ranked[0]
    ensure(get_field(choice, "id"), "selected manhole has no id")
    return choice


def require_fields(name: str, payload: dict[str, Any], fields: list[tuple[str, ...]]) -> None:
    missing: list[str] = []
    for options in fields:
        if all(payload.get(option) in (None, "", []) for option in options):
            missing.append("/".join(options))
    ensure(not missing, f"{name} missing required fields: {', '.join(missing)}")


def normalize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: normalize_value(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [normalize_value(item) for item in value]
    return value


def compare_stable(name: str, first: Any, second: Any, field_groups: list[tuple[str, ...]]) -> None:
    subset_first = {
        "/".join(group): normalize_value(next((first.get(field) for field in group if first.get(field) is not None), None))
        for group in field_groups
    }
    subset_second = {
        "/".join(group): normalize_value(next((second.get(field) for field in group if second.get(field) is not None), None))
        for group in field_groups
    }
    ensure(subset_first == subset_second, f"{name} is not stable across repeated calls")


def check_web_pages(results: list[CheckResult]) -> None:
    for route in ("/dashboard", "/map"):
        status, body = http_request("GET", f"{WEB_BASE_URL}{route}")
        ensure(status == 200, f"{route} did not return 200")
        ensure(isinstance(body, str) and "<html" in body.lower(), f"{route} did not return HTML")
        results.append(CheckResult(f"page:{route}", "200 HTML"))


def check_openapi(results: list[CheckResult]) -> None:
    status, payload = http_request("GET", f"{API_BASE_URL}/openapi.json")
    ensure(status == 200, "openapi.json did not return 200")
    ensure(isinstance(payload, dict) and payload.get("openapi"), "openapi.json is not a valid OpenAPI document")
    results.append(CheckResult("api:openapi", f"OpenAPI {payload.get('openapi')}"))


def check_dynamic_web_pages(manhole_id: str, results: list[CheckResult]) -> None:
    routes = (
        f"/manholes/{manhole_id}",
        f"/manholes/{manhole_id}/diagnosis",
        f"/manholes/{manhole_id}/plan",
        f"/manholes/{manhole_id}/simulation",
        f"/manholes/{manhole_id}/acceptance",
    )
    for route in routes:
        status, body = http_request("GET", f"{WEB_BASE_URL}{route}")
        ensure(status == 200, f"{route} did not return 200")
        ensure(isinstance(body, str) and "<html" in body.lower(), f"{route} did not return HTML")
        results.append(CheckResult(f"page:{route}", "200 HTML"))


def check_map_and_flow(results: list[CheckResult]) -> None:
    status, map_payload = http_request("GET", f"{API_PREFIX}/map/manholes")
    ensure(status == 200, "map/manholes did not return 200")
    features = extract_candidates(map_payload)
    ensure(len(features) >= 20, f"expected at least 20 manholes, got {len(features)}")

    demo_manhole = pick_demo_manhole(features)
    manhole_id = str(get_field(demo_manhole, "id"))
    results.append(
        CheckResult(
            "api:map",
            f"selected manhole {manhole_id} score={get_field(demo_manhole, 'riskScore', 'risk_score')} "
            f"level={get_field(demo_manhole, 'riskLevel', 'risk_level')} "
            f"grade={get_field(demo_manhole, 'diseaseLevel', 'diseaseGrade', 'disease_grade')}",
        )
    )
    check_dynamic_web_pages(manhole_id, results)

    status, detail = http_request("GET", f"{API_PREFIX}/manholes/{urllib.parse.quote(manhole_id)}")
    ensure(status == 200, "manhole detail did not return 200")
    ensure(isinstance(detail, dict), "manhole detail is not an object")
    require_fields(
        "detail",
        detail,
        [
            ("id",),
            ("code",),
            ("roadName", "road_name"),
            ("trafficLevel", "traffic_level"),
            ("riskScore", "risk_score"),
        ],
    )
    results.append(CheckResult("api:detail", f"manhole={detail.get('code', manhole_id)}"))

    status, diagnosis_first = http_request("POST", f"{API_PREFIX}/manholes/{urllib.parse.quote(manhole_id)}/diagnosis", {})
    ensure(status in (200, 201), "diagnosis POST did not return 200/201")
    ensure(isinstance(diagnosis_first, dict), "diagnosis response is not an object")
    require_fields(
        "diagnosis",
        diagnosis_first,
        [
            ("riskScore", "risk_score"),
            ("diseaseLevel", "diseaseGrade", "disease_grade"),
            ("confidence",),
            ("defects",),
        ],
    )
    ensure(
        bool(diagnosis_first.get("polygons") or diagnosis_first.get("heatmapCells") or diagnosis_first.get("heatmap_cells")),
        "diagnosis missing polygons or heatmap data",
    )
    results.append(
        CheckResult(
            "api:diagnosis",
            f"grade={diagnosis_first.get('diseaseLevel', diagnosis_first.get('disease_grade'))} "
            f"score={diagnosis_first.get('riskScore', diagnosis_first.get('risk_score'))}",
        )
    )

    status, diagnosis_second = http_request("POST", f"{API_PREFIX}/manholes/{urllib.parse.quote(manhole_id)}/diagnosis", {})
    ensure(status in (200, 201), "second diagnosis POST did not return 200/201")
    ensure(isinstance(diagnosis_second, dict), "second diagnosis response is not an object")
    compare_stable(
        "diagnosis",
        diagnosis_first,
        diagnosis_second,
        [
            ("riskScore", "risk_score"),
            ("diseaseLevel", "diseaseGrade", "disease_grade"),
            ("polygons",),
            ("heatmapCells", "heatmap_cells"),
        ],
    )
    results.append(CheckResult("api:diagnosis-repeat", "stable"))

    status, plan_first = http_request("POST", f"{API_PREFIX}/manholes/{urllib.parse.quote(manhole_id)}/plan", {})
    ensure(status in (200, 201), "plan POST did not return 200/201")
    ensure(isinstance(plan_first, dict), "plan response is not an object")
    require_fields(
        "plan",
        plan_first,
        [
            ("recommendedMethod", "recommendedMethods", "recommended_methods"),
            ("recommendedMaterials", "materials", "recommended_materials"),
            ("estimatedVolumeL", "estimatedGroutLiters", "estimated_volume_l"),
            ("estimatedDurationMinutes", "estimated_duration_min"),
            ("openTrafficAfterH", "openTrafficHours", "open_traffic_after_h"),
        ],
    )
    results.append(CheckResult("api:plan", "generated"))

    status, plan_second = http_request("POST", f"{API_PREFIX}/manholes/{urllib.parse.quote(manhole_id)}/plan", {})
    ensure(status in (200, 201), "second plan POST did not return 200/201")
    ensure(isinstance(plan_second, dict), "second plan response is not an object")
    compare_stable(
        "plan",
        plan_first,
        plan_second,
        [
            ("recommendedMethod", "recommendedMethods", "recommended_methods"),
            ("recommendedMaterials", "materials", "recommended_materials"),
            ("estimatedVolumeL", "estimatedGroutLiters", "estimated_volume_l"),
            ("openTrafficAfterH", "openTrafficHours", "open_traffic_after_h"),
        ],
    )
    results.append(CheckResult("api:plan-repeat", "stable"))

    status, simulation = http_request("GET", f"{API_PREFIX}/manholes/{urllib.parse.quote(manhole_id)}/simulation")
    ensure(status == 200, "simulation GET did not return 200")
    ensure(isinstance(simulation, dict), "simulation response is not an object")
    steps = simulation.get("steps") or []
    ensure(isinstance(steps, list) and len(steps) >= 4, "simulation must contain at least four steps")
    results.append(CheckResult("api:simulation", f"steps={len(steps)}"))

    status, acceptance_first = http_request("POST", f"{API_PREFIX}/manholes/{urllib.parse.quote(manhole_id)}/acceptance", {})
    ensure(status in (200, 201), "acceptance POST did not return 200/201")
    ensure(isinstance(acceptance_first, dict), "acceptance response is not an object")
    require_fields(
        "acceptance",
        acceptance_first,
        [
            ("reportNo", "reportId", "report_id"),
            ("conclusion", "acceptanceStatus", "acceptance_status"),
            ("beforeAfterMetrics", "beforeMetrics", "before_metrics"),
            ("recommendedNextInspectionAt", "reviewRecommendations", "reinspectionRecommendations", "review_recommendations"),
        ],
    )
    results.append(CheckResult("api:acceptance", "generated"))

    status, acceptance_second = http_request("GET", f"{API_PREFIX}/manholes/{urllib.parse.quote(manhole_id)}/acceptance")
    ensure(status == 200, "acceptance GET did not return 200")
    ensure(isinstance(acceptance_second, dict), "acceptance GET response is not an object")
    compare_stable(
        "acceptance",
        acceptance_first,
        acceptance_second,
        [
            ("reportNo", "reportId", "report_id"),
            ("conclusion", "acceptanceStatus", "acceptance_status"),
            ("beforeAfterMetrics", "beforeMetrics", "before_metrics"),
        ],
    )
    results.append(CheckResult("api:acceptance-refresh", "stable"))


def main() -> int:
    results: list[CheckResult] = []
    try:
        check_web_pages(results)
        check_openapi(results)
        check_map_and_flow(results)
    except SmokeFailure as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        for result in results:
            print(f"PASS {result.name} {result.details}")
        return 1

    for result in results:
        print(f"PASS {result.name} {result.details}")
    print("PASS overall local demo smoke checks completed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
