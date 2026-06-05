from __future__ import annotations

from datetime import UTC, datetime, timedelta

from services.api.app.schemas import (
    DiseaseLevel,
    LatestInspectionSummary,
    Location,
    ManholeDetail,
    ManholeStatus,
    PipelineType,
    ResourceLinks,
    RiskLevel,
    TrafficLevel,
)


PROJECT_ID = "demo-city-sha-001"
BASE_TIME = datetime(2026, 6, 2, 9, 0, tzinfo=UTC)


def _risk_level(score: int) -> RiskLevel:
    if score >= 90:
        return RiskLevel.critical
    if score >= 75:
        return RiskLevel.high
    if score >= 55:
        return RiskLevel.medium
    return RiskLevel.low


def _status_for_level(level: DiseaseLevel) -> ManholeStatus:
    if level == DiseaseLevel.D:
        return ManholeStatus.expert_review
    if level in {DiseaseLevel.B, DiseaseLevel.C}:
        return ManholeStatus.pending_repair
    return ManholeStatus.monitored


def build_seed_manholes() -> list[ManholeDetail]:
    road_names = [
        "科技大道",
        "滨江路",
        "创新中路",
        "智城西路",
        "科苑东路",
        "海纳路",
        "腾飞街",
        "远航路",
        "临港大道",
        "云谷路",
    ]
    districts = ["浦东示范区", "滨江片区", "科创核心区", "北部运维区"]
    pipeline_cycle = [
        PipelineType.storm_water,
        PipelineType.sewage,
        PipelineType.power,
        PipelineType.telecom,
    ]
    levels = [
        DiseaseLevel.A,
        DiseaseLevel.B,
        DiseaseLevel.C,
        DiseaseLevel.D,
        DiseaseLevel.B,
        DiseaseLevel.C,
        DiseaseLevel.C,
        DiseaseLevel.D,
        DiseaseLevel.A,
        DiseaseLevel.B,
        DiseaseLevel.C,
        DiseaseLevel.A,
        DiseaseLevel.B,
        DiseaseLevel.C,
        DiseaseLevel.D,
        DiseaseLevel.A,
        DiseaseLevel.B,
        DiseaseLevel.C,
        DiseaseLevel.A,
        DiseaseLevel.D,
    ]
    risk_scores = [42, 58, 79, 93, 61, 82, 86, 95, 49, 63, 77, 44, 57, 84, 91, 46, 69, 88, 52, 92]

    manholes: list[ManholeDetail] = []
    for index in range(20):
        disease_level = levels[index]
        risk_score = risk_scores[index]
        code_no = index + 1
        inspected_at = BASE_TIME - timedelta(days=index % 7, hours=index)
        last_repair_at = BASE_TIME - timedelta(days=120 + index * 8)
        flatness = {
            DiseaseLevel.A: 2.8,
            DiseaseLevel.B: 4.8,
            DiseaseLevel.C: 7.4,
            DiseaseLevel.D: 10.8,
        }[disease_level] + (index % 2) * 0.4
        height_diff = {
            DiseaseLevel.A: -2.0,
            DiseaseLevel.B: -4.5,
            DiseaseLevel.C: -8.0,
            DiseaseLevel.D: -12.0,
        }[disease_level] - (index % 3) * 0.5
        noise_peak = {
            DiseaseLevel.A: 61.0,
            DiseaseLevel.B: 72.0,
            DiseaseLevel.C: 82.0,
            DiseaseLevel.D: 88.0,
        }[disease_level] + (index % 4)
        void_min = {
            DiseaseLevel.A: 0.0,
            DiseaseLevel.B: 6.0,
            DiseaseLevel.C: 12.0,
            DiseaseLevel.D: 24.0,
        }[disease_level]
        void_max = {
            DiseaseLevel.A: 8.0,
            DiseaseLevel.B: 22.0,
            DiseaseLevel.C: 45.0,
            DiseaseLevel.D: 90.0,
        }[disease_level]
        inspection = LatestInspectionSummary(
            inspectionId=f"insp-{code_no:04d}-v3",
            inspectionVersion="v3",
            inspectedAt=inspected_at,
            heightDiffMm=height_diff,
            flatnessMm=flatness,
            noisePeakDb=noise_peak,
            crackLengthM=round(0.6 + index * 0.18, 1),
            anomalyAreaM2=round(0.3 + index * 0.12, 1),
            voidDepthMinCm=void_min,
            voidDepthMaxCm=void_max,
            complaintCount=(index % 5) + (2 if disease_level in {DiseaseLevel.C, DiseaseLevel.D} else 0),
            settlementMm=round(abs(height_diff) * 1.4, 1),
            vibrationIndex=round(1.2 + index * 0.14, 2),
            radarPreviewAsset=f"/assets/demo/radar/mh-{code_no:04d}.png",
            surfacePhotoUrls=[
                f"/assets/demo/photos/mh-{code_no:04d}-surface-1.jpg",
                f"/assets/demo/photos/mh-{code_no:04d}-surface-2.jpg",
            ],
        )
        if code_no == 7:
            inspection = inspection.model_copy(
                update={
                    "heightDiffMm": -8.0,
                    "flatnessMm": 7.5,
                    "noisePeakDb": 82.0,
                    "anomalyAreaM2": 1.4,
                    "voidDepthMinCm": 12.0,
                    "voidDepthMaxCm": 45.0,
                    "complaintCount": 4,
                }
            )
        manhole_id = f"mh-{code_no:04d}"
        manholes.append(
            ManholeDetail(
                id=manhole_id,
                code=f"JW-A-{code_no:04d}",
                projectId=PROJECT_ID,
                roadId=f"road-{(index % 10) + 1:02d}",
                roadName=road_names[index % len(road_names)],
                district=districts[index % len(districts)],
                location=Location(
                    lon=121.4701 + index * 0.0016,
                    lat=31.2248 + index * 0.0012,
                ),
                manholeType=pipeline_cycle[index % len(pipeline_cycle)].value,
                pipelineType=pipeline_cycle[index % len(pipeline_cycle)],
                trafficLevel=[TrafficLevel.low, TrafficLevel.medium, TrafficLevel.heavy][index % 3],
                status=_status_for_level(disease_level),
                riskScore=risk_score,
                riskLevel=_risk_level(risk_score),
                diseaseLevel=disease_level,
                lastInspectionAt=inspected_at,
                lastRepairAt=last_repair_at,
                repairCount=1 + (index % 4),
                ownerUnit="谛听示范项目组",
                coverType="重型防沉降复合井盖",
                complaintCount=inspection.complaintCount,
                latestInspection=inspection,
                links=ResourceLinks(
                    diagnosis=f"/api/v1/manholes/{manhole_id}/diagnosis",
                    plan=f"/api/v1/manholes/{manhole_id}/plan",
                    simulation=f"/api/v1/manholes/{manhole_id}/simulation",
                    acceptance=f"/api/v1/manholes/{manhole_id}/acceptance",
                ),
            )
        )
    return manholes
