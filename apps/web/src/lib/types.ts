export type RiskLevel = "low" | "medium" | "high" | "critical";
export type DiseaseLevel = "A" | "B" | "C" | "D";
export type PipelineType =
  | "stormWater"
  | "sewage"
  | "power"
  | "telecom"
  | "other";
export type TrafficLevel = "light" | "medium" | "heavy";
export type SurfaceDamageLevel = "minor" | "moderate" | "severe";
export type PrimaryDisease =
  | "void"
  | "looseBase"
  | "debonding"
  | "waterDamage"
  | "frameLooseness"
  | "shaftDefect";
export type RecommendedMethod =
  | "coverLocking"
  | "microGrouting"
  | "ringCutRepair"
  | "fastHardMaterial"
  | "cctvReview"
  | "localExcavation";

export interface LocationPoint {
  lon: number;
  lat: number;
}

export interface LocalPoint {
  x: number;
  y: number;
}

export interface MapFeature {
  id: string;
  code: string;
  riskScore: number;
  riskLevel: RiskLevel;
  diseaseLevel: DiseaseLevel;
  roadName: string;
  district: string;
  pipelineType: PipelineType;
  trafficLevel: TrafficLevel;
  hasDiagnosis: boolean;
  location: LocationPoint;
}

export interface InspectionSnapshot {
  inspectionVersion: string;
  inspectedAt: string;
  heightDiffMm: number;
  flatnessMm: number;
  noisePeakDb: number;
  vibrationIndex: number;
  settlementMm: number;
  crackLengthM: number;
  radarAnomalyAreaM2: number;
  suspectedVoidDepthMinCm: number;
  suspectedVoidDepthMaxCm: number;
  surfaceDamageLevel: SurfaceDamageLevel;
  radarPreviewLabel: string;
  gprSummary: string;
  photoAssets: string[];
}

export interface MaintenanceRecord {
  occurredAt: string;
  action: string;
  note: string;
}

export interface ManholeDetail {
  id: string;
  code: string;
  roadName: string;
  district: string;
  pipeType: PipelineType;
  manholeType: string;
  coverType: string;
  trafficLevel: TrafficLevel;
  owner: string;
  location: LocationPoint;
  riskScore: number;
  riskLevel: RiskLevel;
  diseaseLevel: DiseaseLevel;
  lastInspectedAt: string;
  lastRepairedAt: string;
  complaintCount: number;
  maintenanceCount: number;
  status: "undiagnosed" | "diagnosed" | "planned" | "accepted";
  inspection: InspectionSnapshot;
  history: MaintenanceRecord[];
  latestDiagnosisSummary?: string;
  latestPlanSummary?: string;
  latestAcceptanceSummary?: string;
}

export interface DiagnosisFinding {
  id: string;
  zoneName: string;
  disease: PrimaryDisease;
  confidence: number;
  depthMinCm: number;
  depthMaxCm: number;
  anomalyAreaM2: number;
  polygon: LocalPoint[];
}

export interface RuleFactor {
  label: string;
  scoreImpact: number;
  evidence: string;
}

export interface Diagnosis {
  diagnosisId: string;
  diagnosisVersion: string;
  manholeId: string;
  riskScore: number;
  diseaseLevel: DiseaseLevel;
  primaryDiseases: PrimaryDisease[];
  findings: DiagnosisFinding[];
  confidence: number;
  depthMinCm: number;
  depthMaxCm: number;
  estimatedVoidVolumeLiters: number;
  ruleFactors: RuleFactor[];
  recommendedStrategy: string;
  requiresReview: boolean;
  summary: string;
  generatedAt: string;
}

export interface DiagnosisRequest {
  inspectionVersion: string;
}

export interface RepairMaterial {
  name: string;
  role: string;
  dosage: string;
}

export interface GroutingPoint {
  pointNo: string;
  positionAngleDeg: number;
  distanceFromCoverCm: number;
  depthCm: number;
  targetZoneId: string;
}

export interface RepairPlan {
  planId: string;
  planVersion: string;
  manholeId: string;
  recommendedMethods: RecommendedMethod[];
  strategySummary: string;
  materials: RepairMaterial[];
  groutingPoints: GroutingPoint[];
  pressureRangeMpa: [number, number];
  estimatedGroutLiters: number;
  surfaceRepairAreaM2: number;
  estimatedDurationMinutes: number;
  openTrafficHours: number;
  qualityControls: string[];
  riskWarnings: string[];
  generatedAt: string;
}

export interface SimulationStep {
  id: string;
  title: string;
  detail: string;
  durationMinutes: number;
  status: "pending" | "active" | "completed";
}

export interface TelemetryPoint {
  minute: number;
  pressureMpa: number;
  flowLitersPerMinute: number;
  accumulatedVolumeLiters: number;
  upliftMm: number;
  alertStatus: "normal" | "watch" | "stop";
}

export interface ConstructionSimulation {
  manholeId: string;
  planVersion: string;
  beforeAfterVisualState: {
    before: string;
    after: string;
  };
  steps: SimulationStep[];
  timeline: string[];
  telemetry: TelemetryPoint[];
}

export interface MaterialBatch {
  batchNo: string;
  materialName: string;
  supplier: string;
  producedAt: string;
}

export interface AcceptanceMetrics {
  heightDiffMm: number;
  flatnessMm: number;
  noisePeakDb: number;
  settlementMm: number;
  vibrationIndex: number;
}

export interface AcceptanceReport {
  reportId: string;
  acceptanceVersion: string;
  manholeId: string;
  diagnosisSummary: string;
  repairPlanSummary: string;
  constructionRecords: string[];
  materialBatches: MaterialBatch[];
  beforeMetrics: AcceptanceMetrics;
  afterMetrics: AcceptanceMetrics;
  acceptanceStatus: "passed" | "conditionalReview";
  reopenTrafficAt: string;
  recurrenceRisk: string;
  followUpRecommendation: string;
  generatedAt: string;
}

export interface DashboardSummary {
  projectId: string;
  generatedAt: string;
  totals: {
    manholes: number;
    highRiskManholes: number;
    diagnosedManholes: number;
    plannedManholes: number;
    acceptedManholes: number;
  };
  riskDistribution: Array<{
    riskLevel: RiskLevel;
    count: number;
  }>;
  gradeDistribution: Array<{
    diseaseLevel: DiseaseLevel;
    count: number;
  }>;
  topRisks: Array<{
    manholeId: string;
    code: string;
    roadName: string;
    riskScore: number;
    riskLevel: RiskLevel;
  }>;
  averageOpenTrafficHours: number;
  reinspectionPassRate: number;
  recentActivities: Array<{
    id: string;
    happenedAt: string;
    title: string;
    detail: string;
  }>;
}

export interface DemoScriptStep {
  id: string;
  title: string;
  summary: string;
  route: string;
  talkingPoints: string[];
}

export interface DemoScript {
  scriptId: string;
  recommendedManholeId: string;
  headline: string;
  steps: DemoScriptStep[];
}
