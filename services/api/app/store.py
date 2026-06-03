from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256

from services.api.app.schemas import AcceptanceReport, Diagnosis, ManholeStatus, RepairPlan
from services.api.app.seed import build_seed_manholes
from services.api.app.workflow import (
    build_acceptance_from_plan,
    build_diagnosis_from_inspection,
    build_plan_from_diagnosis,
)


@dataclass
class IdempotencyRecord:
    payload_hash: str
    status_code: int
    body: dict


class RuntimeStore:
    def __init__(self) -> None:
        seeded = build_seed_manholes()
        for item in seeded:
            diagnosis = build_diagnosis_from_inspection(item, item.latestInspection.inspectionVersion, revision=1)
            item.riskScore = diagnosis.riskScore
            item.riskLevel = diagnosis.riskLevel
            item.diseaseLevel = diagnosis.diseaseLevel
            item.status = (
                ManholeStatus.expert_review
                if diagnosis.diseaseLevel.value == "D"
                else ManholeStatus.pending_repair
                if diagnosis.diseaseLevel.value in {"B", "C"}
                else ManholeStatus.monitored
            )
        self.manholes = {item.id: item for item in seeded}
        self.diagnoses: dict[str, Diagnosis] = {}
        self.plans: dict[str, RepairPlan] = {}
        self.acceptances: dict[str, AcceptanceReport] = {}
        self.idempotency_records: dict[tuple[str, str], IdempotencyRecord] = {}
        self._preseed_resources()

    def _preseed_resources(self) -> None:
        seeded_diagnoses = ["mh-0002", "mh-0005", "mh-0007", "mh-0010", "mh-0014", "mh-0018", "mh-0015", "mh-0019"]
        seeded_plans = ["mh-0005", "mh-0007", "mh-0010", "mh-0014", "mh-0015", "mh-0018"]
        seeded_acceptances = ["mh-0005", "mh-0010", "mh-0014", "mh-0018"]

        for manhole_id in seeded_diagnoses:
            manhole = self.manholes[manhole_id]
            diagnosis = build_diagnosis_from_inspection(manhole, manhole.latestInspection.inspectionVersion, revision=1)
            self.diagnoses[manhole_id] = diagnosis
        for manhole_id in seeded_plans:
            plan = build_plan_from_diagnosis(self.manholes[manhole_id], self.diagnoses[manhole_id], revision=1)
            self.plans[manhole_id] = plan
        for manhole_id in seeded_acceptances:
            acceptance = build_acceptance_from_plan(
                self.manholes[manhole_id],
                self.diagnoses[manhole_id],
                self.plans[manhole_id],
                revision=1,
            )
            self.acceptances[manhole_id] = acceptance
        for manhole_id in self.manholes:
            self.refresh_status(manhole_id)

    def refresh_status(self, manhole_id: str) -> None:
        manhole = self.manholes[manhole_id]
        if manhole_id in self.acceptances:
            manhole.status = ManholeStatus.accepted
            return
        if manhole_id in self.plans:
            manhole.status = ManholeStatus.planned
            return
        diagnosis = self.diagnoses.get(manhole_id)
        if diagnosis is None:
            return
        manhole.status = (
            ManholeStatus.expert_review
            if diagnosis.diseaseLevel.value == "D"
            else ManholeStatus.pending_repair
        )

    @staticmethod
    def payload_hash(payload: dict) -> str:
        return sha256(repr(sorted(payload.items())).encode("utf-8")).hexdigest()
