from __future__ import annotations

from fastapi.testclient import TestClient

from services.api.app.main import app


client = TestClient(app)


def test_dashboard_summary_counts_seed_data() -> None:
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["totals"]["manholes"] == 20
    assert payload["totals"]["diagnosedManholes"] >= 8
    assert len(payload["topRisks"]) == 5
    assert response.headers["X-Request-Id"].startswith("req_")


def test_list_and_detail_include_embedded_resources() -> None:
    listing = client.get("/api/v1/manholes", params={"riskLevel": "high", "pageSize": 5})
    assert listing.status_code == 200
    items = listing.json()["items"]
    assert items
    manhole_id = items[0]["id"]

    detail = client.get(f"/api/v1/manholes/{manhole_id}", params={"include": "diagnosis,plan,acceptance"})
    assert detail.status_code == 200
    detail_payload = detail.json()
    assert detail_payload["id"] == manhole_id
    assert "links" in detail_payload
    assert detail.headers["etag"]


def test_map_features_expose_demo_status_metadata() -> None:
    response = client.get("/api/v1/map/manholes", params={"hasDiagnosis": "true"})
    assert response.status_code == 200
    features = response.json()["features"]
    assert features
    mh_0007 = next(item for item in features if item["id"] == "mh-0007")
    assert mh_0007["district"]
    assert mh_0007["trafficLevel"] in {"low", "medium", "heavy"}
    assert mh_0007["status"] == "planned"
    assert mh_0007["hasDiagnosis"] is True
    assert mh_0007["hasPlan"] is True
    assert mh_0007["hasAcceptance"] is False


def test_demo_success_chain_for_c_level_manhole() -> None:
    detail = client.get("/api/v1/manholes/mh-0007")
    inspection_version = detail.json()["latestInspection"]["inspectionVersion"]

    diagnosis = client.post(
        "/api/v1/manholes/mh-0007/diagnosis",
        headers={"Idempotency-Key": "diag-0007"},
        json={"inspectionVersion": inspection_version, "generationMode": "reuse_if_unchanged"},
    )
    assert diagnosis.status_code in {200, 201}
    diagnosis_payload = diagnosis.json()
    assert diagnosis_payload["diseaseLevel"] == "C"
    assert diagnosis_payload["recommendation"]["groutingHoleCount"] == 8

    plan = client.post(
        "/api/v1/manholes/mh-0007/plan",
        headers={"Idempotency-Key": "plan-0007"},
        json={"diagnosisVersion": diagnosis_payload["diagnosisVersion"], "generationMode": "reuse_if_unchanged"},
    )
    assert plan.status_code in {200, 201}
    plan_payload = plan.json()
    assert plan_payload["recommendedMethod"] == "micro_grouting_plus_seat_locking_plus_fast_set_restore"
    assert len(plan_payload["groutingHoles"]) == 8

    simulation = client.get("/api/v1/manholes/mh-0007/simulation", params={"planVersion": plan_payload["planVersion"]})
    assert simulation.status_code == 200
    simulation_payload = simulation.json()
    assert [step["stepCode"] for step in simulation_payload["steps"]] == [
        "layout_holes",
        "pressure_grouting",
        "seat_locking",
        "fast_set_restore",
    ]

    acceptance = client.post(
        "/api/v1/manholes/mh-0007/acceptance",
        headers={"Idempotency-Key": "acc-0007"},
        json={
            "planVersion": plan_payload["planVersion"],
            "includeReportSections": [
                "before_after_metrics",
                "diagnosis_summary",
                "grouting_summary",
                "reinspection_recommendation",
            ],
        },
    )
    assert acceptance.status_code in {200, 201}
    acceptance_payload = acceptance.json()
    assert acceptance_payload["noiseConclusion"] == "验收状态下无明显跳动、空响和异常冲击声"
    assert len(acceptance_payload["beforeAfterMetrics"]) >= 3
    assert acceptance_payload["diagnosisSummary"]
    assert acceptance_payload["repairPlanSummary"]
    assert acceptance_payload["constructionRecords"]
    assert acceptance_payload["materialBatches"]
    metric_codes = {item["metricCode"] for item in acceptance_payload["beforeAfterMetrics"]}
    assert {"settlement_mm", "vibration_index"}.issubset(metric_codes)


def test_demo_post_requests_can_use_latest_versions_by_default() -> None:
    diagnosis = client.post("/api/v1/manholes/mh-0012/diagnosis", json={})
    assert diagnosis.status_code in {200, 201}
    diagnosis_payload = diagnosis.json()
    assert diagnosis_payload["inspectionVersion"] == "v3"

    plan = client.post("/api/v1/manholes/mh-0012/plan", json={})
    assert plan.status_code in {200, 201}
    plan_payload = plan.json()
    assert plan_payload["diagnosisVersion"] == diagnosis_payload["diagnosisVersion"]

    acceptance = client.post("/api/v1/manholes/mh-0012/acceptance", json={})
    assert acceptance.status_code in {200, 201}
    acceptance_payload = acceptance.json()
    assert acceptance_payload["planVersion"] == plan_payload["planVersion"]


def test_plan_requires_diagnosis_precondition() -> None:
    response = client.post(
        "/api/v1/manholes/mh-0001/plan",
        headers={"Idempotency-Key": "fail-plan-0001"},
        json={"diagnosisVersion": "diag-v3-r1", "generationMode": "reuse_if_unchanged"},
    )
    assert response.status_code == 409
    payload = response.json()
    assert payload["error"]["code"] == "PRECONDITION_REQUIRED"
    assert payload["error"]["details"][0]["dependency"] == "diagnosis"


def test_diagnosis_rejects_stale_inspection_version() -> None:
    response = client.post(
        "/api/v1/manholes/mh-0007/diagnosis",
        headers={"Idempotency-Key": "stale-diag-0007"},
        json={"inspectionVersion": "v2", "generationMode": "reuse_if_unchanged"},
    )
    assert response.status_code == 409
    payload = response.json()
    assert payload["error"]["code"] == "CONFLICTING_SOURCE_VERSION"
    assert payload["error"]["details"][0]["currentVersion"] == "v3"
