"""Deterministic mock diagnosis engine for the manhole repair demo.

The engine is intentionally rule-based. It simulates AI-style output while
keeping every score, defect, polygon, and recommendation explainable from the
inspection inputs.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import ceil, cos, radians, sin, sqrt
from typing import Any, Mapping


RULE_VERSION = "mock-diagnosis-rule-v1"

SCORING_WEIGHTS: dict[str, float] = {
    "heightDiffMm": 0.15,
    "flatnessMm": 0.15,
    "noisePeakDb": 0.15,
    "radarAnomalyAreaM2": 0.25,
    "suspectedVoidDepthCm": 0.15,
    "repairCount": 0.10,
    "trafficLevel": 0.05,
}

LEVEL_THRESHOLDS: dict[str, str] = {
    "A": "0-39",
    "B": "40-64",
    "C": "65-84",
    "D": "85-100 or critical trigger",
}

TRAFFIC_SCORES: dict[str, int] = {
    "low": 25,
    "light": 25,
    "medium": 55,
    "normal": 55,
    "heavy": 85,
    "very_heavy": 100,
    "severe": 100,
}

ROAD_CLASS_TRAFFIC_FLOOR: dict[str, int] = {
    "local": 25,
    "collector": 45,
    "secondary": 55,
    "arterial": 75,
    "primary": 85,
    "expressway": 100,
}

SCORING_FORMULA_TEXT = (
    "riskScore = round(clamp(0.15*heightDiffMmScore + "
    "0.15*flatnessMmScore + 0.15*noisePeakDbScore + "
    "0.25*radarAnomalyAreaM2Score + 0.15*suspectedVoidDepthCmScore + "
    "0.10*repairCountScore + 0.05*trafficLevelScore, 0, 100)); "
    "D is forced when a critical deep-void trigger is present."
)


class DiagnosisValidationError(ValueError):
    """Raised when inspection inputs cannot be diagnosed."""


@dataclass(frozen=True)
class DiagnosisInput:
    height_diff_mm: float
    flatness_mm: float
    noise_peak_db: float
    repair_count: int
    radar_anomaly_area_m2: float
    suspected_void_depth_min_cm: float
    suspected_void_depth_max_cm: float
    traffic_level: str
    road_class: str | None = None
    road_moisture_percent: float | None = None
    surface_temperature_c: float | None = None

    @classmethod
    def from_mapping(cls, payload: Mapping[str, Any]) -> "DiagnosisInput":
        depth_min_present = _has_any(payload, "suspectedVoidDepthMinCm", "suspected_void_depth_min_cm")
        depth_max_present = _has_any(payload, "suspectedVoidDepthMaxCm", "suspected_void_depth_max_cm")
        depth_single_present = _has_any(payload, "suspectedVoidDepthCm", "suspected_void_depth_cm")

        if depth_min_present or depth_max_present:
            depth_min = _number(payload, "suspectedVoidDepthMinCm", "suspected_void_depth_min_cm", default=0)
            depth_max = _number(payload, "suspectedVoidDepthMaxCm", "suspected_void_depth_max_cm", default=depth_min)
        elif depth_single_present:
            depth_min = depth_max = _number(payload, "suspectedVoidDepthCm", "suspected_void_depth_cm")
        else:
            raise DiagnosisValidationError("Missing required field suspectedVoidDepthCm or depth min/max fields.")

        if depth_min > depth_max:
            depth_min, depth_max = depth_max, depth_min

        return cls(
            height_diff_mm=_number(payload, "heightDiffMm", "height_difference_mm", "heightDiff"),
            flatness_mm=_number(payload, "flatnessMm", "flatness_mm", "straightedgeFlatnessMm"),
            noise_peak_db=_number(payload, "noisePeakDb", "noise_peak_db", "noisePeak"),
            repair_count=int(_number(payload, "repairCount", "historicalRepairCount", "repair_count")),
            radar_anomaly_area_m2=_number(
                payload,
                "radarAnomalyAreaM2",
                "radar_anomaly_area_m2",
                "radarAnomalyArea",
            ),
            suspected_void_depth_min_cm=depth_min,
            suspected_void_depth_max_cm=depth_max,
            traffic_level=str(_required(payload, "trafficLevel", "traffic_level")),
            road_class=_optional_str(payload, "roadClass", "road_class"),
            road_moisture_percent=_optional_number(
                payload,
                "roadMoisturePercent",
                "road_moisture_percent",
                "moisturePercent",
            ),
            surface_temperature_c=_optional_number(
                payload,
                "surfaceTemperatureC",
                "surface_temperature_c",
                "temperatureC",
            ),
        ).validated()

    def validated(self) -> "DiagnosisInput":
        non_negative_fields = {
            "flatnessMm": self.flatness_mm,
            "noisePeakDb": self.noise_peak_db,
            "repairCount": self.repair_count,
            "radarAnomalyAreaM2": self.radar_anomaly_area_m2,
            "suspectedVoidDepthMinCm": self.suspected_void_depth_min_cm,
            "suspectedVoidDepthMaxCm": self.suspected_void_depth_max_cm,
        }
        for field_name, value in non_negative_fields.items():
            if value < 0:
                raise DiagnosisValidationError(f"{field_name} must be non-negative.")

        normalized_traffic = _normalize_key(self.traffic_level)
        if normalized_traffic not in TRAFFIC_SCORES:
            allowed = ", ".join(sorted(set(TRAFFIC_SCORES)))
            raise DiagnosisValidationError(f"trafficLevel must be one of: {allowed}.")

        normalized_road_class = _normalize_key(self.road_class) if self.road_class else None
        if normalized_road_class and normalized_road_class not in ROAD_CLASS_TRAFFIC_FLOOR:
            allowed = ", ".join(sorted(ROAD_CLASS_TRAFFIC_FLOOR))
            raise DiagnosisValidationError(f"roadClass must be one of: {allowed}.")

        moisture = self.road_moisture_percent
        if moisture is not None and not 0 <= moisture <= 100:
            raise DiagnosisValidationError("roadMoisturePercent must be between 0 and 100.")

        return DiagnosisInput(
            height_diff_mm=self.height_diff_mm,
            flatness_mm=self.flatness_mm,
            noise_peak_db=self.noise_peak_db,
            repair_count=self.repair_count,
            radar_anomaly_area_m2=self.radar_anomaly_area_m2,
            suspected_void_depth_min_cm=self.suspected_void_depth_min_cm,
            suspected_void_depth_max_cm=self.suspected_void_depth_max_cm,
            traffic_level=normalized_traffic,
            road_class=normalized_road_class,
            road_moisture_percent=self.road_moisture_percent,
            surface_temperature_c=self.surface_temperature_c,
        )


def diagnose_manhole(input_data: DiagnosisInput | Mapping[str, Any]) -> dict[str, Any]:
    """Return a deterministic diagnosis payload suitable for FastAPI responses."""

    diagnosis_input = (
        input_data.validated()
        if isinstance(input_data, DiagnosisInput)
        else DiagnosisInput.from_mapping(input_data)
    )
    factor_scores = _factor_scores(diagnosis_input)
    weighted_contributions = {
        key: round(factor_scores[key] * SCORING_WEIGHTS[key], 2) for key in SCORING_WEIGHTS
    }
    raw_score = sum(weighted_contributions.values())
    critical_triggers = _critical_triggers(diagnosis_input, factor_scores)
    risk_score = int(round(_clamp(raw_score, 0, 100)))
    if critical_triggers:
        risk_score = max(85, risk_score)

    disease_level = _disease_level(risk_score, critical_triggers)
    risk_level = _risk_level(risk_score)
    defects = _build_defects(diagnosis_input, factor_scores, disease_level)
    heatmap_cells = _build_heatmap_cells(defects)
    polygons = _build_polygons(defects)
    confidence = _overall_confidence(risk_score, factor_scores)
    grouting_points = _build_grouting_points(diagnosis_input, disease_level)
    estimated_grout_liters = _estimate_grout_liters(diagnosis_input, disease_level, len(grouting_points))
    grouting_points = _assign_point_liters(grouting_points, estimated_grout_liters)
    open_traffic_hours = _open_traffic_hours(diagnosis_input, disease_level)
    recurrence_risk = _recurrence_risk(diagnosis_input, risk_score, factor_scores, disease_level)
    recommended_method = _recommended_method(disease_level)
    recommended_materials = _recommended_materials(disease_level, estimated_grout_liters)
    summary = _summary(disease_level, risk_score, defects, recommended_method)

    return {
        "ruleVersion": RULE_VERSION,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "diseaseLevel": disease_level,
        "defects": defects,
        "confidence": confidence,
        "summary": summary,
        "heatmapCells": heatmap_cells,
        "polygons": polygons,
        "recommendedMethod": recommended_method,
        "recommendedMaterials": recommended_materials,
        "groutingPoints": grouting_points,
        "groutingPointCount": len(grouting_points),
        "estimatedGroutLiters": estimated_grout_liters,
        "openTrafficHours": open_traffic_hours,
        "recurrenceRisk": recurrence_risk,
        "recommendation": {
            "recommendedMethod": recommended_method,
            "openTrafficHours": open_traffic_hours,
            "estimatedGroutLiters": estimated_grout_liters,
            "groutingHoleCount": len(grouting_points),
        },
        "scoringFormula": {
            "version": RULE_VERSION,
            "formula": SCORING_FORMULA_TEXT,
            "weights": SCORING_WEIGHTS,
            "factorScores": factor_scores,
            "weightedContributions": weighted_contributions,
            "levelThresholds": LEVEL_THRESHOLDS,
            "criticalTriggers": critical_triggers,
        },
    }


def example_inputs_by_level() -> dict[str, dict[str, Any]]:
    """Stable examples used by tests and later seed generation."""

    return {
        "A": {
            "heightDiffMm": 1.5,
            "flatnessMm": 2.5,
            "noisePeakDb": 62,
            "repairCount": 0,
            "radarAnomalyAreaM2": 0.05,
            "suspectedVoidDepthMinCm": 0,
            "suspectedVoidDepthMaxCm": 0,
            "trafficLevel": "light",
            "roadClass": "local",
        },
        "B": {
            "heightDiffMm": -4,
            "flatnessMm": 4.5,
            "noisePeakDb": 72,
            "repairCount": 1,
            "radarAnomalyAreaM2": 0.6,
            "suspectedVoidDepthMinCm": 8,
            "suspectedVoidDepthMaxCm": 25,
            "trafficLevel": "medium",
            "roadClass": "collector",
        },
        "C": {
            "heightDiffMm": -8,
            "flatnessMm": 7.5,
            "noisePeakDb": 82,
            "repairCount": 3,
            "radarAnomalyAreaM2": 1.4,
            "suspectedVoidDepthMinCm": 12,
            "suspectedVoidDepthMaxCm": 45,
            "trafficLevel": "heavy",
            "roadClass": "arterial",
        },
        "D": {
            "heightDiffMm": -14,
            "flatnessMm": 12,
            "noisePeakDb": 91,
            "repairCount": 4,
            "radarAnomalyAreaM2": 2.2,
            "suspectedVoidDepthMinCm": 45,
            "suspectedVoidDepthMaxCm": 95,
            "trafficLevel": "very_heavy",
            "roadClass": "expressway",
        },
    }


def _factor_scores(input_data: DiagnosisInput) -> dict[str, float]:
    traffic_score = float(TRAFFIC_SCORES[input_data.traffic_level])
    if input_data.road_class:
        traffic_score = max(traffic_score, float(ROAD_CLASS_TRAFFIC_FLOOR[input_data.road_class]))

    return {
        "heightDiffMm": round(_linear_score(abs(input_data.height_diff_mm), 0, 10), 2),
        "flatnessMm": round(_linear_score(input_data.flatness_mm, 0, 10), 2),
        "noisePeakDb": round(_linear_score(input_data.noise_peak_db, 55, 85), 2),
        "radarAnomalyAreaM2": round(_linear_score(input_data.radar_anomaly_area_m2, 0, 1.5), 2),
        "suspectedVoidDepthCm": round(
            _linear_score(input_data.suspected_void_depth_max_cm, 0, 60),
            2,
        ),
        "repairCount": round(_linear_score(input_data.repair_count, 0, 4), 2),
        "trafficLevel": round(_clamp(traffic_score, 0, 100), 2),
    }


def _build_defects(
    input_data: DiagnosisInput,
    factor_scores: Mapping[str, float],
    disease_level: str,
) -> list[dict[str, Any]]:
    defects: list[dict[str, Any]] = []
    depth_min = round(input_data.suspected_void_depth_min_cm, 1)
    depth_max = round(input_data.suspected_void_depth_max_cm, 1)

    if disease_level == "A":
        return [
            _defect(
                defect_id="def-minor-ring-1",
                defect_type="minor_cover_gap_or_surface_wear",
                area_label="cover_ring",
                depth_min_cm=0,
                depth_max_cm=5,
                confidence=0.72,
                severity="minor",
                polygon=_rectangle(0, 0, 0.45, 0.45),
                evidence=["low surface deviation", "no sustained radar anomaly"],
            )
        ]

    if factor_scores["heightDiffMm"] >= 35 or factor_scores["flatnessMm"] >= 35:
        defects.append(
            _defect(
                defect_id="def-settlement-1",
                defect_type="differential_settlement",
                area_label="north_ring",
                depth_min_cm=0,
                depth_max_cm=max(8, min(depth_max, 18)),
                confidence=_defect_confidence(
                    0.58,
                    factor_scores["heightDiffMm"],
                    factor_scores["flatnessMm"],
                ),
                severity=_severity(max(factor_scores["heightDiffMm"], factor_scores["flatnessMm"])),
                polygon=_rectangle(0.05, 0.45, 0.8, 0.38),
                evidence=["height difference", "three-meter straightedge flatness"],
            )
        )

    if factor_scores["noisePeakDb"] >= 45:
        defects.append(
            _defect(
                defect_id="def-seat-1",
                defect_type="seat_looseness_or_cover_rattle",
                area_label="cover_seat",
                depth_min_cm=0,
                depth_max_cm=12,
                confidence=_defect_confidence(
                    0.60,
                    factor_scores["noisePeakDb"],
                    factor_scores["heightDiffMm"],
                ),
                severity=_severity(factor_scores["noisePeakDb"]),
                polygon=_rectangle(0, 0, 0.55, 0.55),
                evidence=["noise peak", "cover-seat impact risk"],
            )
        )

    if input_data.radar_anomaly_area_m2 >= 0.25 and depth_max <= 35:
        defects.append(
            _defect(
                defect_id="def-shallow-void-1",
                defect_type="shallow_void_or_debonding",
                area_label="southeast",
                depth_min_cm=max(depth_min, 6),
                depth_max_cm=max(depth_max, 18),
                confidence=_defect_confidence(0.62, factor_scores["radarAnomalyAreaM2"]),
                severity=_severity(factor_scores["radarAnomalyAreaM2"]),
                polygon=_scaled_rectangle(0.48, -0.42, input_data.radar_anomaly_area_m2, 0.85),
                evidence=["radar anomaly area", "shallow suspected void depth"],
            )
        )

    if input_data.radar_anomaly_area_m2 >= 0.7 and depth_max > 25:
        defects.append(
            _defect(
                defect_id="def-loose-base-1",
                defect_type="loose_base_with_local_void",
                area_label="west_base",
                depth_min_cm=max(depth_min, 15),
                depth_max_cm=depth_max,
                confidence=_defect_confidence(
                    0.64,
                    factor_scores["radarAnomalyAreaM2"],
                    factor_scores["suspectedVoidDepthCm"],
                ),
                severity=_severity(max(factor_scores["radarAnomalyAreaM2"], factor_scores["suspectedVoidDepthCm"])),
                polygon=_scaled_rectangle(-0.55, 0.12, input_data.radar_anomaly_area_m2, 1.0),
                evidence=["radar anomaly area", "void depth", "base support loss"],
            )
        )

    if input_data.suspected_void_depth_max_cm >= 70 or disease_level == "D":
        defects.append(
            _defect(
                defect_id="def-deep-void-1",
                defect_type="deep_void_or_structural_failure_risk",
                area_label="south_deep_zone",
                depth_min_cm=max(depth_min, 35),
                depth_max_cm=depth_max,
                confidence=_defect_confidence(
                    0.70,
                    factor_scores["suspectedVoidDepthCm"],
                    factor_scores["radarAnomalyAreaM2"],
                ),
                severity="critical",
                polygon=_scaled_rectangle(0.20, -0.72, input_data.radar_anomaly_area_m2, 1.2),
                evidence=["deep void trigger", "large radar anomaly"],
            )
        )

    if input_data.repair_count >= 2:
        defects.append(
            _defect(
                defect_id="def-recurrence-1",
                defect_type="recurrent_patch_failure",
                area_label="previous_repair_ring",
                depth_min_cm=0,
                depth_max_cm=max(10, min(depth_max, 30)),
                confidence=_defect_confidence(0.58, factor_scores["repairCount"]),
                severity=_severity(factor_scores["repairCount"]),
                polygon=_rectangle(-0.22, 0.28, 0.65, 0.42),
                evidence=["historical repair count"],
            )
        )

    return defects or [
        _defect(
            defect_id="def-observation-1",
            defect_type="minor_surface_observation",
            area_label="cover_ring",
            depth_min_cm=0,
            depth_max_cm=5,
            confidence=0.68,
            severity="minor",
            polygon=_rectangle(0, 0, 0.40, 0.40),
            evidence=["weak but non-zero inspection signal"],
        )
    ]


def _defect(
    *,
    defect_id: str,
    defect_type: str,
    area_label: str,
    depth_min_cm: float,
    depth_max_cm: float,
    confidence: float,
    severity: str,
    polygon: list[list[float]],
    evidence: list[str],
) -> dict[str, Any]:
    return {
        "id": defect_id,
        "defectType": defect_type,
        "areaLabel": area_label,
        "severity": severity,
        "depthMinCm": round(depth_min_cm, 1),
        "depthMaxCm": round(depth_max_cm, 1),
        "depthRange": f"{round(depth_min_cm, 1)}-{round(depth_max_cm, 1)}cm",
        "confidence": round(_clamp(confidence, 0.5, 0.98), 2),
        "coordinateSpace": "local_manhole_plane",
        "polygon": polygon,
        "evidence": evidence,
    }


def _build_heatmap_cells(defects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cells: list[dict[str, Any]] = []
    for defect in defects:
        xs = [point[0] for point in defect["polygon"]]
        ys = [point[1] for point in defect["polygon"]]
        width = max(xs) - min(xs)
        height = max(ys) - min(ys)
        cells.append(
            {
                "x": round(sum(xs) / len(xs), 3),
                "y": round(sum(ys) / len(ys), 3),
                "radiusM": round(max(0.18, (width + height) / 4), 3),
                "intensity": defect["confidence"],
                "defectId": defect["id"],
            }
        )
    return cells


def _build_polygons(defects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": defect["id"],
            "defectType": defect["defectType"],
            "coordinateSpace": "local_manhole_plane",
            "points": defect["polygon"],
        }
        for defect in defects
    ]


def _build_grouting_points(input_data: DiagnosisInput, disease_level: str) -> list[dict[str, Any]]:
    point_count = _grouting_point_count(input_data, disease_level)
    if point_count == 0:
        return []

    depth_min = max(12.0, input_data.suspected_void_depth_min_cm)
    depth_max = max(depth_min, input_data.suspected_void_depth_max_cm)
    radius = 0.42 if disease_level == "B" else 0.62
    second_ring_radius = 0.86 if disease_level == "C" and point_count >= 8 else radius
    start_angle = 25 if disease_level == "B" else -20
    points: list[dict[str, Any]] = []

    for index in range(point_count):
        use_second_ring = disease_level == "C" and index >= ceil(point_count / 2)
        point_radius = second_ring_radius if use_second_ring else radius
        angle = start_angle + (360 / point_count) * index
        if disease_level == "C" and index % 3 == 0:
            point_radius += 0.10
        depth_ratio = 0 if point_count == 1 else index / (point_count - 1)
        depth_cm = depth_min + (depth_max - depth_min) * depth_ratio
        points.append(
            {
                "holeId": f"G{index + 1:02d}",
                "x": round(point_radius * cos(radians(angle)), 3),
                "y": round(point_radius * sin(radians(angle)), 3),
                "depthCm": round(depth_cm, 1),
                "targetZoneId": _target_zone_id(disease_level, index),
                "estimatedGroutLiters": 0.0,
            }
        )

    return points


def _assign_point_liters(points: list[dict[str, Any]], total_liters: float) -> list[dict[str, Any]]:
    if not points:
        return points

    per_point = total_liters / len(points)
    assigned = []
    running_total = 0.0
    for index, point in enumerate(points):
        point_copy = dict(point)
        if index == len(points) - 1:
            liters = round(max(total_liters - running_total, 0), 1)
        else:
            depth_bias = 1 + min(point_copy["depthCm"] / 120, 0.25)
            liters = round(per_point * depth_bias, 1)
            running_total += liters
        point_copy["estimatedGroutLiters"] = liters
        assigned.append(point_copy)
    return assigned


def _estimate_grout_liters(input_data: DiagnosisInput, disease_level: str, point_count: int) -> float:
    if point_count == 0 or disease_level == "D":
        return 0.0

    depth_span_m = max(
        0.08,
        (input_data.suspected_void_depth_max_cm - input_data.suspected_void_depth_min_cm) / 100,
    )
    void_ratio = 0.055 if disease_level == "B" else 0.09
    volume_liters = input_data.radar_anomaly_area_m2 * depth_span_m * void_ratio * 1000
    minimum_liters = point_count * (3.0 if disease_level == "B" else 4.0)
    return round(max(volume_liters, minimum_liters), 1)


def _grouting_point_count(input_data: DiagnosisInput, disease_level: str) -> int:
    if disease_level in {"A", "D"}:
        return 0
    if input_data.radar_anomaly_area_m2 < 0.2:
        return 0
    if disease_level == "B":
        return int(_clamp(ceil(input_data.radar_anomaly_area_m2 * 3) + 2, 2, 5))
    return int(_clamp(round(input_data.radar_anomaly_area_m2 * 3) + 4, 6, 12))


def _recommended_method(disease_level: str) -> str:
    return {
        "A": "cover_adjustment_and_anti_noise_locking",
        "B": "seat_locking_plus_ring_fast_repair",
        "C": "micro_grouting_plus_seat_locking_plus_fast_set_restore",
        "D": "cctv_review_plus_local_excavation_or_network_repair",
    }[disease_level]


def _recommended_materials(disease_level: str, estimated_grout_liters: float) -> list[dict[str, Any]]:
    common_fast_repair = {
        "materialCode": "FAST_SET_LOW_SHRINK_COMPOSITE",
        "materialName": "快硬低收缩水泥基复合材料",
        "purpose": "恢复井座周边承压过渡层",
        "estimatedQuantity": 1,
        "unit": "set",
    }
    anti_noise = {
        "materialCode": "ANTI_VIBRATION_GASKET_AND_LIMITER",
        "materialName": "防震响胶圈及限位件",
        "purpose": "降低盖座冲击和异常行车异响",
        "estimatedQuantity": 1,
        "unit": "set",
    }
    interface_agent = {
        "materialCode": "HIGH_BOND_INTERFACE_AGENT",
        "materialName": "高粘结界面处理剂",
        "purpose": "提高旧路面与快修材料粘结可靠性",
        "estimatedQuantity": 1,
        "unit": "set",
    }

    if disease_level == "A":
        return [anti_noise]
    if disease_level == "B":
        return [common_fast_repair, interface_agent, anti_noise]
    if disease_level == "C":
        return [
            {
                "materialCode": "CONTROLLED_DIFFUSION_MICROFINE_GROUT",
                "materialName": "可控扩散型微细注浆料",
                "purpose": "填充局部脱空并加固松散基层",
                "estimatedQuantity": estimated_grout_liters,
                "unit": "L",
            },
            common_fast_repair,
            interface_agent,
            anti_noise,
        ]
    return [
        {
            "materialCode": "CCTV_AND_STRUCTURAL_REVIEW",
            "materialName": "CCTV 复核与结构核验包",
            "purpose": "维修前复核深层空洞、渗漏或结构性破坏",
            "estimatedQuantity": 1,
            "unit": "set",
        }
    ]


def _open_traffic_hours(input_data: DiagnosisInput, disease_level: str) -> int:
    hours = {"A": 1, "B": 2, "C": 2, "D": 8}[disease_level]
    if disease_level in {"B", "C"}:
        if input_data.surface_temperature_c is not None and input_data.surface_temperature_c < 5:
            hours += 1
        if input_data.road_moisture_percent is not None and input_data.road_moisture_percent > 85:
            hours += 1
    return hours


def _recurrence_risk(
    input_data: DiagnosisInput,
    risk_score: int,
    factor_scores: Mapping[str, float],
    disease_level: str,
) -> dict[str, Any]:
    critical_bonus = 4.0 if disease_level == "D" else 0.0
    three_month = (
        2.0
        + risk_score * 0.04
        + input_data.repair_count * 1.2
        + factor_scores["trafficLevel"] * 0.01
        + critical_bonus
    )
    six_month = three_month * 1.45 + 1.0
    twelve_month = three_month * 2.05 + 2.0
    twelve_month = _clamp(twelve_month, 3, 55)
    label = "low"
    if twelve_month >= 35:
        label = "critical"
    elif twelve_month >= 22:
        label = "high"
    elif twelve_month >= 12:
        label = "medium"

    return {
        "threeMonthPercent": round(_clamp(three_month, 1, 35), 1),
        "sixMonthPercent": round(_clamp(six_month, 2, 45), 1),
        "twelveMonthPercent": round(twelve_month, 1),
        "label": label,
        "drivers": _recurrence_drivers(input_data, factor_scores, disease_level),
    }


def _recurrence_drivers(
    input_data: DiagnosisInput,
    factor_scores: Mapping[str, float],
    disease_level: str,
) -> list[str]:
    drivers: list[str] = []
    if input_data.repair_count >= 2:
        drivers.append("repeated historical repairs")
    if factor_scores["trafficLevel"] >= 80:
        drivers.append("heavy traffic loading")
    if factor_scores["radarAnomalyAreaM2"] >= 65:
        drivers.append("large subsurface anomaly area")
    if factor_scores["suspectedVoidDepthCm"] >= 70:
        drivers.append("deep suspected void")
    if disease_level == "D":
        drivers.append("micro-repair exit boundary")
    return drivers or ["low recurrence drivers after recommended repair"]


def _summary(
    disease_level: str,
    risk_score: int,
    defects: list[dict[str, Any]],
    recommended_method: str,
) -> str:
    primary_defects = ", ".join(defect["defectType"] for defect in defects[:3])
    return (
        f"Level {disease_level} diagnosis with risk score {risk_score}; "
        f"primary findings: {primary_defects}; recommended method: {recommended_method}."
    )


def _critical_triggers(input_data: DiagnosisInput, factor_scores: Mapping[str, float]) -> list[str]:
    triggers: list[str] = []
    if (
        input_data.suspected_void_depth_max_cm >= 80
        and input_data.radar_anomaly_area_m2 >= 1.2
    ):
        triggers.append("deep_void_with_large_radar_anomaly")
    if (
        input_data.suspected_void_depth_max_cm >= 70
        and factor_scores["trafficLevel"] >= 85
        and input_data.repair_count >= 3
    ):
        triggers.append("deep_void_under_heavy_repeated_loading")
    return triggers


def _disease_level(risk_score: int, critical_triggers: list[str]) -> str:
    if critical_triggers or risk_score >= 85:
        return "D"
    if risk_score >= 65:
        return "C"
    if risk_score >= 40:
        return "B"
    return "A"


def _risk_level(risk_score: int) -> str:
    if risk_score >= 85:
        return "critical"
    if risk_score >= 65:
        return "high"
    if risk_score >= 40:
        return "medium"
    return "low"


def _overall_confidence(risk_score: int, factor_scores: Mapping[str, float]) -> float:
    evidence_count = sum(1 for value in factor_scores.values() if value >= 35)
    max_factor = max(factor_scores.values())
    if risk_score < 25 and max_factor < 30:
        return 0.82
    confidence = 0.60 + min(evidence_count * 0.06, 0.30)
    if factor_scores["radarAnomalyAreaM2"] >= 30:
        confidence += 0.05
    return round(_clamp(confidence, 0.60, 0.95), 2)


def _defect_confidence(base: float, *scores: float) -> float:
    if not scores:
        return base
    return round(_clamp(base + (sum(scores) / len(scores)) * 0.003, 0.55, 0.96), 2)


def _severity(score: float) -> str:
    if score >= 85:
        return "critical"
    if score >= 65:
        return "major"
    if score >= 40:
        return "moderate"
    return "minor"


def _target_zone_id(disease_level: str, index: int) -> str:
    if disease_level == "B":
        return "seat_ring"
    return "loose_base" if index % 2 == 0 else "local_void"


def _rectangle(center_x: float, center_y: float, width: float, height: float) -> list[list[float]]:
    half_width = width / 2
    half_height = height / 2
    return [
        [round(center_x - half_width, 3), round(center_y - half_height, 3)],
        [round(center_x + half_width, 3), round(center_y - half_height, 3)],
        [round(center_x + half_width, 3), round(center_y + half_height, 3)],
        [round(center_x - half_width, 3), round(center_y + half_height, 3)],
    ]


def _scaled_rectangle(
    center_x: float,
    center_y: float,
    anomaly_area_m2: float,
    scale: float,
) -> list[list[float]]:
    side = sqrt(max(anomaly_area_m2, 0.08)) * scale
    return _rectangle(center_x, center_y, min(side, 1.4), min(side * 0.75, 1.1))


def _linear_score(value: float, low: float, high: float) -> float:
    if high <= low:
        raise ValueError("high must be greater than low")
    return _clamp(((value - low) / (high - low)) * 100, 0, 100)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _normalize_key(value: str | None) -> str:
    return str(value or "").strip().lower().replace("-", "_").replace(" ", "_")


def _has_any(payload: Mapping[str, Any], *keys: str) -> bool:
    return any(key in payload for key in keys)


def _required(payload: Mapping[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in payload:
            value = payload[key]
            if value is None:
                raise DiagnosisValidationError(f"{key} is required.")
            return value
    raise DiagnosisValidationError(f"Missing required field {keys[0]}.")


def _number(payload: Mapping[str, Any], *keys: str, default: float | None = None) -> float:
    try:
        return float(_required(payload, *keys))
    except DiagnosisValidationError:
        if default is not None:
            return float(default)
        raise
    except (TypeError, ValueError) as exc:
        raise DiagnosisValidationError(f"{keys[0]} must be a number.") from exc


def _optional_number(payload: Mapping[str, Any], *keys: str) -> float | None:
    for key in keys:
        if key in payload and payload[key] is not None:
            try:
                return float(payload[key])
            except (TypeError, ValueError) as exc:
                raise DiagnosisValidationError(f"{key} must be a number.") from exc
    return None


def _optional_str(payload: Mapping[str, Any], *keys: str) -> str | None:
    for key in keys:
        if key in payload and payload[key] is not None:
            value = str(payload[key]).strip()
            return value or None
    return None


__all__ = [
    "DiagnosisInput",
    "DiagnosisValidationError",
    "LEVEL_THRESHOLDS",
    "RULE_VERSION",
    "SCORING_FORMULA_TEXT",
    "SCORING_WEIGHTS",
    "diagnose_manhole",
    "example_inputs_by_level",
]
