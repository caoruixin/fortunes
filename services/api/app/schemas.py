from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class DiseaseLevel(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class PipelineType(str, Enum):
    storm_water = "storm_water"
    sewage = "sewage"
    power = "power"
    telecom = "telecom"


class TrafficLevel(str, Enum):
    low = "low"
    medium = "medium"
    heavy = "heavy"


class ManholeStatus(str, Enum):
    monitored = "monitored"
    pending_repair = "pending_repair"
    planned = "planned"
    accepted = "accepted"
    expert_review = "expert_review"


class GenerationMode(str, Enum):
    reuse_if_unchanged = "reuse_if_unchanged"
    force_recompute = "force_recompute"


class ReportSection(str, Enum):
    before_after_metrics = "before_after_metrics"
    diagnosis_summary = "diagnosis_summary"
    grouting_summary = "grouting_summary"
    reinspection_recommendation = "reinspection_recommendation"


class Location(CamelModel):
    lon: float
    lat: float


class LatestInspectionSummary(CamelModel):
    inspectionId: str
    inspectionVersion: str
    inspectedAt: datetime
    heightDiffMm: float
    flatnessMm: float
    noisePeakDb: float
    crackLengthM: float
    anomalyAreaM2: float
    voidDepthMinCm: float
    voidDepthMaxCm: float
    complaintCount: int
    settlementMm: float
    vibrationIndex: float
    radarPreviewAsset: str
    surfacePhotoUrls: list[str]


class ResourceLinks(CamelModel):
    diagnosis: str
    plan: str
    simulation: str
    acceptance: str


class EmbeddedDiagnosisSummary(CamelModel):
    diagnosisVersion: str
    generatedAt: datetime
    riskScore: int
    riskLevel: RiskLevel
    diseaseLevel: DiseaseLevel


class EmbeddedPlanSummary(CamelModel):
    planVersion: str
    recommendedMethod: str
    estimatedDurationMinutes: int
    openTrafficHours: int


class EmbeddedAcceptanceSummary(CamelModel):
    acceptanceVersion: str
    generatedAt: datetime
    conclusion: str


class ManholeListItem(CamelModel):
    id: str
    code: str
    projectId: str
    roadId: str
    roadName: str
    location: Location
    manholeType: str
    pipelineType: PipelineType
    trafficLevel: TrafficLevel
    status: ManholeStatus
    riskScore: int
    riskLevel: RiskLevel
    diseaseLevel: DiseaseLevel
    lastInspectionAt: datetime
    lastRepairAt: datetime
    repairCount: int


class ManholeDetail(ManholeListItem):
    district: str
    ownerUnit: str
    coverType: str
    complaintCount: int
    latestInspection: LatestInspectionSummary
    links: ResourceLinks
    diagnosis: EmbeddedDiagnosisSummary | None = None
    plan: EmbeddedPlanSummary | None = None
    acceptance: EmbeddedAcceptanceSummary | None = None


class PageInfo(CamelModel):
    pageSize: int
    nextPageToken: str | None = None


class ManholeListResponse(CamelModel):
    items: list[ManholeListItem]
    page: PageInfo


class RiskDistributionItem(CamelModel):
    riskLevel: RiskLevel
    count: int


class TopRiskItem(CamelModel):
    manholeId: str
    code: str
    roadName: str
    riskScore: int
    riskLevel: RiskLevel


class DashboardTotals(CamelModel):
    manholes: int
    highRiskManholes: int
    diagnosedManholes: int
    plannedManholes: int
    acceptedManholes: int


class DashboardSummary(CamelModel):
    projectId: str
    generatedAt: datetime
    totals: DashboardTotals
    riskDistribution: list[RiskDistributionItem]
    topRisks: list[TopRiskItem]


class MapManholeFeature(CamelModel):
    id: str
    code: str
    riskScore: int
    riskLevel: RiskLevel
    diseaseLevel: DiseaseLevel
    roadName: str
    district: str
    pipelineType: PipelineType
    trafficLevel: TrafficLevel
    status: ManholeStatus
    hasDiagnosis: bool
    hasPlan: bool
    hasAcceptance: bool
    location: Location


class MapMeta(CamelModel):
    count: int
    limit: int


class MapManholeFeatureCollection(CamelModel):
    coordinateReferenceSystem: str = "WGS84"
    features: list[MapManholeFeature]
    meta: MapMeta


class DiagnosisRequest(CamelModel):
    inspectionVersion: str | None = None
    generationMode: GenerationMode = GenerationMode.reuse_if_unchanged


class DefectRegion(CamelModel):
    defectType: str
    areaLabel: str
    depthMinCm: float
    depthMaxCm: float
    confidence: float = Field(ge=0, le=1)
    coordinateSpace: str = "local_manhole_plane"
    polygon: list[list[float]]


class HeatmapCell(CamelModel):
    x: float
    y: float
    radiusM: float
    intensity: float = Field(ge=0, le=1)


class DiagnosisRecommendation(CamelModel):
    recommendedMethod: str
    openTrafficHours: int
    estimatedGroutLiters: float
    groutingHoleCount: int


class Diagnosis(CamelModel):
    manholeId: str
    diagnosisVersion: str
    inspectionVersion: str
    generationStatus: str
    generatedAt: datetime
    riskScore: int = Field(ge=0, le=100)
    riskLevel: RiskLevel
    diseaseLevel: DiseaseLevel
    confidence: float = Field(ge=0, le=1)
    summary: str
    defects: list[DefectRegion]
    heatmapCells: list[HeatmapCell]
    recommendation: DiagnosisRecommendation


class PlanRequest(CamelModel):
    diagnosisVersion: str | None = None
    generationMode: GenerationMode = GenerationMode.reuse_if_unchanged


class PlanMaterial(CamelModel):
    materialCode: str
    materialName: str
    purpose: str


class GroutingHole(CamelModel):
    holeId: str
    x: float
    y: float
    depthCm: float
    estimatedGroutLiters: float


class RepairPlan(CamelModel):
    manholeId: str
    planVersion: str
    diagnosisVersion: str
    generationStatus: str
    diseaseLevel: DiseaseLevel
    recommendedMethod: str
    recommendedMaterials: list[PlanMaterial]
    groutingHoles: list[GroutingHole]
    estimatedDurationMinutes: int
    openTrafficHours: int
    estimatedGroutLiters: float
    expectedGarbageReductionPercent: float


class SimulationStep(CamelModel):
    stepCode: str
    title: str
    sequence: int
    estimatedDurationMinutes: int
    visualType: str
    metrics: dict[str, int | float | str]


class SimulationTargetOutcomes(CamelModel):
    flatnessAfterMm: float
    heightDiffAfterMm: float
    noiseStatus: str
    openTrafficHours: int


class Simulation(CamelModel):
    manholeId: str
    planVersion: str
    coordinateSpace: str = "local_manhole_plane"
    steps: list[SimulationStep]
    targetOutcomes: SimulationTargetOutcomes


class AcceptanceRequest(CamelModel):
    planVersion: str | None = None
    includeReportSections: list[ReportSection] = [
        ReportSection.before_after_metrics,
        ReportSection.diagnosis_summary,
        ReportSection.grouting_summary,
        ReportSection.reinspection_recommendation,
    ]


class BeforeAfterMetric(CamelModel):
    metricCode: str
    before: float
    after: float
    target: float
    unit: str


class RecurrenceRisk(CamelModel):
    risk3Months: float = Field(ge=0, le=1)
    risk6Months: float = Field(ge=0, le=1)
    risk12Months: float = Field(ge=0, le=1)


class MaterialBatch(CamelModel):
    batchNo: str
    materialName: str
    supplier: str
    producedAt: str


class AcceptanceReport(CamelModel):
    manholeId: str
    acceptanceVersion: str
    planVersion: str
    reportNo: str
    generatedAt: datetime
    conclusion: str
    diagnosisSummary: str
    repairPlanSummary: str
    constructionRecords: list[str]
    materialBatches: list[MaterialBatch]
    beforeAfterMetrics: list[BeforeAfterMetric]
    noiseConclusion: str
    openTrafficAt: datetime
    recurrenceRisk: RecurrenceRisk
    recommendedNextInspectionAt: datetime


class DemoSceneFocus(CamelModel):
    manholeId: str


class DemoScene(CamelModel):
    sceneCode: str
    sequence: int
    route: str
    title: str
    narration: str
    focus: DemoSceneFocus | None = None


class DemoScript(CamelModel):
    scriptId: str
    audience: str
    title: str
    manholeId: str
    scenes: list[DemoScene]


class ErrorDetail(CamelModel):
    field: str
    issue: str
    currentVersion: str | None = None
    dependency: str | None = None


class ErrorBody(CamelModel):
    code: str
    message: str
    details: list[ErrorDetail]
    correlationId: str


class ErrorResponse(CamelModel):
    error: ErrorBody
