from __future__ import annotations

from datetime import UTC, datetime, timedelta

from services.api.app.diagnosis_engine import diagnose_manhole
from services.api.app.schemas import (
    AcceptanceReport,
    BeforeAfterMetric,
    DefectRegion,
    Diagnosis,
    DiagnosisRecommendation,
    DiseaseLevel,
    GroutingHole,
    HeatmapCell,
    ManholeDetail,
    MaterialBatch,
    PlanMaterial,
    RecurrenceRisk,
    RepairPlan,
    RiskLevel,
    Simulation,
    SimulationStep,
    SimulationTargetOutcomes,
)

def _engine_input(manhole: ManholeDetail) -> dict[str, object]:
    inspection = manhole.latestInspection
    road_class = {
        "low": "local",
        "medium": "collector",
        "heavy": "arterial",
    }[manhole.trafficLevel.value]
    traffic_level = {
        "low": "light",
        "medium": "medium",
        "heavy": "heavy",
    }[manhole.trafficLevel.value]
    return {
        "heightDiffMm": inspection.heightDiffMm,
        "flatnessMm": inspection.flatnessMm,
        "noisePeakDb": inspection.noisePeakDb,
        "repairCount": manhole.repairCount,
        "radarAnomalyAreaM2": inspection.anomalyAreaM2,
        "suspectedVoidDepthMinCm": inspection.voidDepthMinCm,
        "suspectedVoidDepthMaxCm": inspection.voidDepthMaxCm,
        "trafficLevel": traffic_level,
        "roadClass": road_class,
    }


def _engine_result(manhole: ManholeDetail) -> dict[str, object]:
    return diagnose_manhole(_engine_input(manhole))


def _defect_templates(level: DiseaseLevel) -> tuple[list[DefectRegion], list[HeatmapCell]]:
    if level == DiseaseLevel.A:
        defects = [
            DefectRegion(
                defectType="seat_looseness",
                areaLabel="cover_ring",
                depthMinCm=0,
                depthMaxCm=8,
                confidence=0.84,
                polygon=[[0.15, 0.1], [0.32, 0.08], [0.28, -0.14], [0.12, -0.1]],
            )
        ]
        heatmap = [HeatmapCell(x=0.18, y=0.02, radiusM=0.18, intensity=0.62)]
        return defects, heatmap
    if level == DiseaseLevel.B:
        defects = [
            DefectRegion(
                defectType="debonding",
                areaLabel="northwest",
                depthMinCm=6,
                depthMaxCm=18,
                confidence=0.88,
                polygon=[[-0.38, 0.2], [-0.12, 0.24], [-0.16, -0.02], [-0.42, 0.0]],
            ),
            DefectRegion(
                defectType="seat_looseness",
                areaLabel="bearing_ring",
                depthMinCm=0,
                depthMaxCm=12,
                confidence=0.9,
                polygon=[[0.08, 0.32], [0.26, 0.34], [0.22, 0.12], [0.06, 0.14]],
            ),
        ]
        heatmap = [
            HeatmapCell(x=-0.25, y=0.14, radiusM=0.24, intensity=0.74),
            HeatmapCell(x=0.15, y=0.22, radiusM=0.18, intensity=0.68),
        ]
        return defects, heatmap
    if level == DiseaseLevel.C:
        defects = [
            DefectRegion(
                defectType="void",
                areaLabel="southeast",
                depthMinCm=12,
                depthMaxCm=28,
                confidence=0.92,
                polygon=[[0.3, -0.1], [0.82, -0.08], [0.74, -0.58], [0.24, -0.52]],
            ),
            DefectRegion(
                defectType="loosened_base",
                areaLabel="west",
                depthMinCm=20,
                depthMaxCm=45,
                confidence=0.88,
                polygon=[[-0.85, 0.2], [-0.3, 0.3], [-0.36, -0.36], [-0.9, -0.22]],
            ),
            DefectRegion(
                defectType="seat_looseness",
                areaLabel="bearing_ring",
                depthMinCm=0,
                depthMaxCm=15,
                confidence=0.91,
                polygon=[[-0.12, 0.42], [0.18, 0.4], [0.2, 0.14], [-0.08, 0.16]],
            ),
        ]
        heatmap = [
            HeatmapCell(x=0.46, y=-0.26, radiusM=0.25, intensity=0.92),
            HeatmapCell(x=-0.56, y=0.02, radiusM=0.32, intensity=0.84),
            HeatmapCell(x=0.02, y=0.24, radiusM=0.2, intensity=0.7),
        ]
        return defects, heatmap

    defects = [
        DefectRegion(
            defectType="deep_cavity",
            areaLabel="south",
            depthMinCm=26,
            depthMaxCm=90,
            confidence=0.95,
            polygon=[[0.18, -0.12], [0.9, -0.18], [0.84, -0.82], [0.08, -0.76]],
        ),
        DefectRegion(
            defectType="water_damage",
            areaLabel="perimeter",
            depthMinCm=10,
            depthMaxCm=36,
            confidence=0.9,
            polygon=[[-0.92, 0.52], [0.94, 0.5], [0.86, -0.48], [-0.88, -0.46]],
        ),
    ]
    heatmap = [
        HeatmapCell(x=0.42, y=-0.4, radiusM=0.38, intensity=0.96),
        HeatmapCell(x=-0.1, y=0.08, radiusM=0.48, intensity=0.83),
    ]
    return defects, heatmap


def _recommended_method(level: DiseaseLevel) -> str:
    if level == DiseaseLevel.A:
        return "cover_ring_adjustment_plus_seal_replacement"
    if level == DiseaseLevel.B:
        return "seat_locking_plus_fast_set_restore"
    if level == DiseaseLevel.C:
        return "micro_grouting_plus_seat_locking_plus_fast_set_restore"
    return "cctv_review_plus_local_excavation_recommended"


def build_diagnosis_from_inspection(
    manhole: ManholeDetail,
    inspection_version: str,
    *,
    revision: int,
    generation_status: str = "created",
) -> Diagnosis:
    result = _engine_result(manhole)
    level = DiseaseLevel(result["diseaseLevel"])
    risk_score = int(result["riskScore"])
    defects = [
        DefectRegion(
            defectType=item["defectType"],
            areaLabel=item["areaLabel"],
            depthMinCm=item["depthMinCm"],
            depthMaxCm=item["depthMaxCm"],
            confidence=item["confidence"],
            polygon=item["polygon"],
        )
        for item in result["defects"]
    ]
    heatmap = [
        HeatmapCell(
            x=item["x"],
            y=item["y"],
            radiusM=item["radiusM"],
            intensity=item["intensity"],
        )
        for item in result["heatmapCells"]
    ]
    summary = {
        DiseaseLevel.A: "井盖承压面轻微松动，建议更换胶圈并调平。",
        DiseaseLevel.B: "浅层脱空伴随井座松动，宜先做井座锁固和环形快修。",
        DiseaseLevel.C: "井周基层松散伴随局部脱空，建议微孔注浆和井座锁固。",
        DiseaseLevel.D: "发现深层空洞或水损扩展迹象，应先做 CCTV 复核并评估局部开挖。",
    }[level]
    return Diagnosis(
        manholeId=manhole.id,
        diagnosisVersion=f"diag-{inspection_version}-r{revision}",
        inspectionVersion=inspection_version,
        generationStatus=generation_status,
        generatedAt=datetime(2026, 6, 2, 18, 31, tzinfo=UTC) + timedelta(minutes=revision - 1),
        riskScore=risk_score,
        riskLevel=RiskLevel(result["riskLevel"]),
        diseaseLevel=level,
        confidence=float(result["confidence"]),
        summary=summary,
        defects=defects,
        heatmapCells=heatmap,
        recommendation=DiagnosisRecommendation(
            recommendedMethod=str(result["recommendedMethod"]),
            openTrafficHours=int(result["openTrafficHours"]),
            estimatedGroutLiters=float(result["estimatedGroutLiters"]),
            groutingHoleCount=int(result["groutingPointCount"]),
        ),
    )


def build_plan_from_diagnosis(
    manhole: ManholeDetail,
    diagnosis: Diagnosis,
    *,
    revision: int,
    generation_status: str = "created",
) -> RepairPlan:
    result = _engine_result(manhole)
    method = str(result["recommendedMethod"])
    materials = [
        PlanMaterial(
            materialCode=item["materialCode"],
            materialName=item["materialName"],
            purpose=item["purpose"],
        )
        for item in result["recommendedMaterials"]
    ]
    hole_layouts = [
        GroutingHole(
            holeId=item["holeId"],
            x=item["x"],
            y=item["y"],
            depthCm=item["depthCm"],
            estimatedGroutLiters=item["estimatedGroutLiters"],
        )
        for item in result["groutingPoints"]
    ]
    duration = {
        DiseaseLevel.A: 35,
        DiseaseLevel.B: 70,
        DiseaseLevel.C: 110,
        DiseaseLevel.D: 160,
    }[diagnosis.diseaseLevel]
    open_hours = int(result["openTrafficHours"])
    garbage_reduction = {
        DiseaseLevel.A: 70.0,
        DiseaseLevel.B: 65.0,
        DiseaseLevel.C: 60.0,
        DiseaseLevel.D: 20.0,
    }[diagnosis.diseaseLevel]

    return RepairPlan(
        manholeId=manhole.id,
        planVersion=f"plan-{diagnosis.diagnosisVersion}-r{revision}",
        diagnosisVersion=diagnosis.diagnosisVersion,
        generationStatus=generation_status,
        diseaseLevel=diagnosis.diseaseLevel,
        recommendedMethod=method,
        recommendedMaterials=materials,
        groutingHoles=hole_layouts,
        estimatedDurationMinutes=duration,
        openTrafficHours=open_hours,
        estimatedGroutLiters=float(result["estimatedGroutLiters"]),
        expectedGarbageReductionPercent=garbage_reduction,
    )


def build_simulation_from_plan(manhole: ManholeDetail, plan: RepairPlan) -> Simulation:
    steps = [
        SimulationStep(
            stepCode="layout_holes",
            title="精准布孔",
            sequence=1,
            estimatedDurationMinutes=15,
            visualType="hole_layout",
            metrics={"holeCount": len(plan.groutingHoles)},
        ),
        SimulationStep(
            stepCode="pressure_grouting",
            title="低压分级注浆",
            sequence=2,
            estimatedDurationMinutes=45 if plan.diseaseLevel == DiseaseLevel.C else 25,
            visualType="grout_diffusion",
            metrics={
                "targetPressureMpa": 0.25 if plan.diseaseLevel != DiseaseLevel.D else 0.18,
                "targetGroutLiters": plan.estimatedGroutLiters,
                "maxSurfaceLiftMm": 1.0,
            },
        ),
        SimulationStep(
            stepCode="seat_locking",
            title="井座锁固与调平",
            sequence=3,
            estimatedDurationMinutes=20,
            visualType="seat_locking",
            metrics={"targetHeightDiffMm": -2 if plan.diseaseLevel != DiseaseLevel.D else -4},
        ),
        SimulationStep(
            stepCode="fast_set_restore",
            title="快硬材料恢复",
            sequence=4,
            estimatedDurationMinutes=30,
            visualType="surface_restore",
            metrics={"openTrafficHours": plan.openTrafficHours},
        ),
    ]
    target_outcomes = SimulationTargetOutcomes(
        flatnessAfterMm=2.4 if plan.diseaseLevel in {DiseaseLevel.B, DiseaseLevel.C} else 2.8,
        heightDiffAfterMm=-2.0 if plan.diseaseLevel != DiseaseLevel.D else -4.0,
        noiseStatus="no_obvious_abnormal_impact_sound",
        openTrafficHours=plan.openTrafficHours,
    )
    return Simulation(
        manholeId=manhole.id,
        planVersion=plan.planVersion,
        steps=steps,
        targetOutcomes=target_outcomes,
    )


def build_acceptance_from_plan(
    manhole: ManholeDetail,
    diagnosis: Diagnosis,
    plan: RepairPlan,
    *,
    revision: int,
    generated_at: datetime | None = None,
) -> AcceptanceReport:
    generated_at = generated_at or datetime(2026, 6, 2, 18, 34, tzinfo=UTC) + timedelta(minutes=revision - 1)
    inspection = manhole.latestInspection
    result = _engine_result(manhole)
    flatness_after = 2.4 if plan.diseaseLevel in {DiseaseLevel.B, DiseaseLevel.C} else 2.8
    height_diff_after = -2.0 if plan.diseaseLevel != DiseaseLevel.D else -4.0
    noise_after = max(60.0, inspection.noisePeakDb - 14.0)
    recurrence = result["recurrenceRisk"]
    settlement_after = round(max(1.1, inspection.settlementMm * (0.32 if diagnosis.diseaseLevel != DiseaseLevel.D else 0.85)), 1)
    vibration_after = round(max(0.18, inspection.vibrationIndex * (0.42 if diagnosis.diseaseLevel != DiseaseLevel.D else 0.9)), 2)
    if diagnosis.diseaseLevel == DiseaseLevel.D:
        construction_records = [
            "已完成现场围挡和交通安全提示",
            "已发起 CCTV 复核，待确认渗漏与结构破坏边界",
            "未进入直接微创注浆闭环",
        ]
        material_batches = [
            MaterialBatch(
                batchNo="RV-CCTV-20260602",
                materialName="CCTV 复核服务单",
                supplier="示范片区养护队",
                producedAt="2026-06-02",
            )
        ]
    else:
        construction_records = [
            f"已完成 {len(plan.groutingHoles)} 点布孔与低压分级注浆",
            f"累计注浆 {plan.estimatedGroutLiters:.1f} L，路面抬升控制在 1.4 mm 内",
            "已完成井座锁固、调平与快硬材料恢复",
        ]
        material_batches = [
            MaterialBatch(
                batchNo=f"{material.materialCode}-20260602",
                materialName=material.materialName,
                supplier="示范路养材中心",
                producedAt="2026-06-02",
            )
            for material in plan.recommendedMaterials
        ]
    return AcceptanceReport(
        manholeId=manhole.id,
        acceptanceVersion=f"acc-{plan.planVersion}-r{revision}",
        planVersion=plan.planVersion,
        reportNo=f"ACC-20260602-{manhole.id[-4:]}",
        generatedAt=generated_at,
        conclusion="accepted_with_quantified_targets_met" if diagnosis.diseaseLevel != DiseaseLevel.D else "accepted_with_follow_up_review_required",
        diagnosisSummary=diagnosis.summary,
        repairPlanSummary=(
            "CCTV 复核与局部开挖评估分支"
            if diagnosis.diseaseLevel == DiseaseLevel.D
            else f"{plan.recommendedMethod}，预计 {plan.estimatedDurationMinutes} 分钟施工，{plan.openTrafficHours} 小时开放交通"
        ),
        constructionRecords=construction_records,
        materialBatches=material_batches,
        beforeAfterMetrics=[
            BeforeAfterMetric(
                metricCode="flatness_mm",
                before=inspection.flatnessMm,
                after=flatness_after,
                target=3.0,
                unit="mm",
            ),
            BeforeAfterMetric(
                metricCode="height_diff_mm",
                before=inspection.heightDiffMm,
                after=height_diff_after,
                target=-2.0 if diagnosis.diseaseLevel != DiseaseLevel.D else -4.0,
                unit="mm",
            ),
            BeforeAfterMetric(
                metricCode="noise_peak_db",
                before=inspection.noisePeakDb,
                after=noise_after,
                target=68.0,
                unit="dB",
            ),
            BeforeAfterMetric(
                metricCode="settlement_mm",
                before=inspection.settlementMm,
                after=settlement_after,
                target=2.0 if diagnosis.diseaseLevel != DiseaseLevel.D else inspection.settlementMm,
                unit="mm",
            ),
            BeforeAfterMetric(
                metricCode="vibration_index",
                before=inspection.vibrationIndex,
                after=vibration_after,
                target=0.8 if diagnosis.diseaseLevel != DiseaseLevel.D else inspection.vibrationIndex,
                unit="index",
            ),
        ],
        noiseConclusion="验收状态下无明显跳动、空响和异常冲击声",
        openTrafficAt=generated_at + timedelta(hours=plan.openTrafficHours),
        recurrenceRisk=RecurrenceRisk(
            risk3Months=round(float(recurrence["threeMonthPercent"]) / 100, 2),
            risk6Months=round(float(recurrence["sixMonthPercent"]) / 100, 2),
            risk12Months=round(float(recurrence["twelveMonthPercent"]) / 100, 2),
        ),
        recommendedNextInspectionAt=generated_at + timedelta(days=90),
    )
