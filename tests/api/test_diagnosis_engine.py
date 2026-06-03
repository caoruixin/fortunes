from pathlib import Path
import sys

import pytest


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "services" / "api"))

from app.diagnosis_engine import (  # noqa: E402
    DiagnosisValidationError,
    SCORING_WEIGHTS,
    diagnose_manhole,
    example_inputs_by_level,
)


def test_examples_cover_all_disease_levels():
    examples = example_inputs_by_level()

    for expected_level, payload in examples.items():
        result = diagnose_manhole(payload)

        assert result["diseaseLevel"] == expected_level
        assert 0 <= result["riskScore"] <= 100
        assert result["defects"]
        assert result["confidence"] >= 0.6
        assert result["heatmapCells"]
        assert result["polygons"]
        assert result["recommendedMethod"]
        assert result["recommendedMaterials"]
        assert "scoringFormula" in result
        assert result["scoringFormula"]["weights"] == SCORING_WEIGHTS


def test_c_level_demo_case_matches_expected_repair_parameters():
    result = diagnose_manhole(example_inputs_by_level()["C"])

    assert result["riskScore"] == 83
    assert result["riskLevel"] == "high"
    assert result["diseaseLevel"] == "C"
    assert result["recommendedMethod"] == "micro_grouting_plus_seat_locking_plus_fast_set_restore"
    assert result["groutingPointCount"] == 8
    assert len(result["groutingPoints"]) == 8
    assert result["estimatedGroutLiters"] == 41.6
    assert result["openTrafficHours"] == 2
    assert result["recurrenceRisk"]["label"] == "high"
    assert {
        "differential_settlement",
        "seat_looseness_or_cover_rattle",
        "loose_base_with_local_void",
    }.issubset({defect["defectType"] for defect in result["defects"]})


def test_d_level_uses_exit_boundary_instead_of_micro_grouting():
    result = diagnose_manhole(example_inputs_by_level()["D"])

    assert result["diseaseLevel"] == "D"
    assert result["riskScore"] == 100
    assert result["recommendedMethod"] == "cctv_review_plus_local_excavation_or_network_repair"
    assert result["groutingPointCount"] == 0
    assert result["groutingPoints"] == []
    assert result["estimatedGroutLiters"] == 0.0
    assert "deep_void_with_large_radar_anomaly" in result["scoringFormula"]["criticalTriggers"]


def test_same_input_produces_identical_output():
    payload = example_inputs_by_level()["B"]

    first = diagnose_manhole(payload)
    second = diagnose_manhole(dict(payload))

    assert first == second


def test_formula_contributions_sum_to_risk_score_without_critical_trigger():
    result = diagnose_manhole(example_inputs_by_level()["B"])
    contributions = result["scoringFormula"]["weightedContributions"]

    assert result["scoringFormula"]["criticalTriggers"] == []
    assert round(sum(contributions.values())) == result["riskScore"]
    assert set(contributions) == set(SCORING_WEIGHTS)


def test_validation_rejects_unknown_traffic_level():
    payload = {
        **example_inputs_by_level()["A"],
        "trafficLevel": "weekend-only",
    }

    with pytest.raises(DiagnosisValidationError):
        diagnose_manhole(payload)


def test_single_void_depth_alias_is_supported():
    payload = {
        "heightDiffMm": 5,
        "flatnessMm": 5,
        "noisePeakDb": 70,
        "repairCount": 1,
        "radarAnomalyAreaM2": 0.7,
        "suspectedVoidDepthCm": 28,
        "trafficLevel": "medium",
    }

    result = diagnose_manhole(payload)

    assert result["diseaseLevel"] in {"B", "C"}
    assert result["defects"]
