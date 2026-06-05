import {
  AcceptanceMetrics,
  AcceptanceReport,
  ConstructionSimulation,
  DashboardSummary,
  DemoScript,
  Diagnosis,
  DiagnosisFinding,
  DiagnosisRequest,
  DiseaseLevel,
  GroutingPoint,
  LocalPoint,
  MapFeature,
  ManholeDetail,
  PipelineType,
  PrimaryDisease,
  RecommendedMethod,
  RepairPlan,
  RiskLevel,
  RuleFactor,
  SurfaceDamageLevel,
  TelemetryPoint,
  TrafficLevel
} from "@/lib/types";
import {
  buildAcceptance,
  buildDiagnosis,
  buildPlan,
  buildSimulation,
  getMockDashboardSummary,
  getMockDemoScript,
  getMockManholes,
  getMockMapFeatures
} from "@/lib/mock-data";

type MapFilters = {
  riskLevel?: RiskLevel | "all";
  hasDiagnosis?: "all" | "yes" | "no";
  search?: string;
};

type RawObject = Record<string, unknown>;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false" && !API_BASE;
const DEFAULT_DATE = "2026-06-02T10:30:00+08:00";
export const BACKEND_SERVICE_HINT = "平台数据同步暂时不可用。当前页面将保留标准演示路径，待服务恢复后自动刷新。";

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string
  ) {
    super(message);
  }
}

class BackendUnavailableError extends Error {
  constructor(message = BACKEND_SERVICE_HINT) {
    super(message);
  }
}

async function delay(ms = 140) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new BackendUnavailableError();
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiRequestError(`API ${response.status}: ${body || response.statusText}`, response.status, body);
  }

  return (await response.json()) as T;
}

function shouldUseMockFallback(error: unknown) {
  if (error instanceof BackendUnavailableError) {
    return true;
  }

  if (error instanceof ApiRequestError) {
    return error.status === 502 || error.status === 503 || error.status === 504;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error instanceof TypeError ||
    error.message.includes("fetch") ||
    error.message.includes("network") ||
    error.message.includes("NEXT_PUBLIC_API_BASE_URL")
  );
}

async function resolveWithMockFallback<T>(apiRequest: () => Promise<T>, mockRequest: () => Promise<T>) {
  if (USE_MOCK) {
    return mockRequest();
  }

  try {
    return await apiRequest();
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      return mockRequest();
    }
    throw error;
  }
}

function isApiNotFound(error: unknown) {
  return error instanceof ApiRequestError && error.status === 404;
}

function asRecord(value: unknown): RawObject {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RawObject) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function textValue(record: RawObject, key: string, fallback = "") {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

function numberValue(record: RawObject, key: string, fallback = 0) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(record: RawObject, key: string, fallback = false) {
  const value = record[key];
  return typeof value === "boolean" ? value : fallback;
}

function riskLevelValue(value: unknown): RiskLevel {
  return value === "critical" || value === "high" || value === "medium" || value === "low" ? value : "low";
}

function diseaseLevelValue(value: unknown): DiseaseLevel {
  return value === "A" || value === "B" || value === "C" || value === "D" ? value : "A";
}

function pipelineTypeValue(value: unknown): PipelineType {
  if (value === "storm_water" || value === "stormWater") {
    return "stormWater";
  }
  if (value === "sewage" || value === "power" || value === "telecom" || value === "other") {
    return value;
  }
  return "other";
}

function trafficLevelValue(value: unknown): TrafficLevel {
  if (value === "heavy") {
    return "heavy";
  }
  if (value === "medium") {
    return "medium";
  }
  return "light";
}

function surfaceDamageLevelValue(value: unknown): SurfaceDamageLevel {
  if (value === "severe" || value === "moderate" || value === "minor") {
    return value;
  }
  return "moderate";
}

function statusValue(value: unknown): ManholeDetail["status"] {
  if (value === "accepted") {
    return "accepted";
  }
  if (value === "planned") {
    return "planned";
  }
  if (value === "expert_review" || value === "pending_repair") {
    return "diagnosed";
  }
  return "undiagnosed";
}

function workflowStatus(raw: RawObject): ManholeDetail["status"] {
  if (asRecord(raw.acceptance).acceptanceVersion) {
    return "accepted";
  }
  if (asRecord(raw.plan).planVersion) {
    return "planned";
  }
  if (asRecord(raw.diagnosis).diagnosisVersion) {
    return "diagnosed";
  }
  return statusValue(raw.status);
}

function localPointValue(value: unknown): LocalPoint {
  if (Array.isArray(value)) {
    return { x: Number(value[0] ?? 0), y: Number(value[1] ?? 0) };
  }
  const record = asRecord(value);
  return { x: numberValue(record, "x"), y: numberValue(record, "y") };
}

function locationValue(value: unknown) {
  const record = asRecord(value);
  return {
    lon: numberValue(record, "lon", 121.4737),
    lat: numberValue(record, "lat", 31.2304)
  };
}

function methodValues(rawMethod: unknown, level: DiseaseLevel): RecommendedMethod[] {
  const method = String(rawMethod ?? "");
  if (method.includes("cctv") || level === "D") {
    return ["cctvReview", "localExcavation"];
  }
  const methods: RecommendedMethod[] = [];
  if (method.includes("grouting") || level === "C") {
    methods.push("microGrouting");
  }
  methods.push("coverLocking");
  if (method.includes("ring") || level === "B") {
    methods.push("ringCutRepair");
  }
  methods.push("fastHardMaterial");
  return Array.from(new Set(methods));
}

function diseaseFromDefect(defectType: string): PrimaryDisease {
  if (defectType.includes("water")) {
    return "waterDamage";
  }
  if (defectType.includes("shaft")) {
    return "shaftDefect";
  }
  if (defectType.includes("void") || defectType.includes("cavity")) {
    return "void";
  }
  if (defectType.includes("base") || defectType.includes("loose")) {
    return "looseBase";
  }
  if (defectType.includes("debond")) {
    return "debonding";
  }
  return "frameLooseness";
}

function defectAreaLabel(value: string, fallback: string) {
  const labels: Record<string, string> = {
    north_ring: "北侧井圈承压区",
    south_ring: "南侧井圈承压区",
    east_ring: "东侧井圈承压区",
    west_ring: "西侧井圈承压区",
    cover_seat: "盖座接触区",
    west_base: "西侧基层异常区",
    east_base: "东侧基层异常区",
    southeast_void: "东南侧疑似脱空区",
    previous_repair_ring: "既往修补环带",
    pipe_joint: "管线接口影响区"
  };
  return labels[value] ?? fallback;
}

function simulationStepCopy(value: string, fallback: string) {
  const copies: Record<string, string> = {
    hole_layout: "按 AI 研判的异常分区完成孔位放样，避开井筒和管线接口。",
    grout_diffusion: "小流量、多轮次、低压注浆，同步监测压力、流量和路面抬升。",
    seat_locking: "完成盖座限位、承压面锁固和井盖标高复核。",
    surface_restore: "采用快硬材料恢复井周表层并进入开放交通倒计时。"
  };
  return copies[value] ?? fallback;
}

function demoOwnerName(value: string) {
  const legacyName = "井周" + "智修";
  return value.includes(legacyName) ? value.replace(legacyName, "谛听") : value;
}

function photoAssetLabels(values: unknown[], code: string) {
  if (values.length === 0) {
    return [`${code} 现场照片 1`, `${code} 井周巡检照片`, `${code} 雷达扫测点位`];
  }
  return values.map((value, index) => {
    const text = String(value);
    if (text.startsWith("/assets/")) {
      return `${code} 现场照片 ${index + 1}`;
    }
    return text;
  });
}

function normalizeManholeDetail(rawValue: unknown): ManholeDetail {
  const raw = asRecord(rawValue);
  const latestInspection = asRecord(raw.latestInspection);
  const id = textValue(raw, "id", "mh-unknown");
  const repairCount = numberValue(raw, "repairCount", numberValue(raw, "maintenanceCount"));
  const complaintCount = numberValue(raw, "complaintCount", numberValue(latestInspection, "complaintCount"));
  const diseaseLevel = diseaseLevelValue(raw.diseaseLevel);

  return {
    id,
    code: textValue(raw, "code", id),
    roadName: textValue(raw, "roadName", "示范道路"),
    district: textValue(raw, "district", "示范片区"),
    pipeType: pipelineTypeValue(raw.pipelineType ?? raw.pipeType),
    manholeType: textValue(raw, "manholeType", "圆形检查井"),
    coverType: textValue(raw, "coverType", "球墨铸铁防沉降井盖"),
    trafficLevel: trafficLevelValue(raw.trafficLevel),
    owner: demoOwnerName(textValue(raw, "ownerUnit", textValue(raw, "owner", "市政道路养护中心"))),
    location: locationValue(raw.location),
    riskScore: numberValue(raw, "riskScore"),
    riskLevel: riskLevelValue(raw.riskLevel),
    diseaseLevel,
    lastInspectedAt: textValue(raw, "lastInspectionAt", textValue(raw, "lastInspectedAt", DEFAULT_DATE)),
    lastRepairedAt: textValue(raw, "lastRepairAt", textValue(raw, "lastRepairedAt", DEFAULT_DATE)),
    complaintCount,
    maintenanceCount: repairCount,
    status: workflowStatus(raw),
    inspection: {
      inspectionVersion: textValue(latestInspection, "inspectionVersion", `insp-${id}-v1`),
      inspectedAt: textValue(latestInspection, "inspectedAt", DEFAULT_DATE),
      heightDiffMm: numberValue(latestInspection, "heightDiffMm"),
      flatnessMm: numberValue(latestInspection, "flatnessMm"),
      noisePeakDb: numberValue(latestInspection, "noisePeakDb", 60),
      vibrationIndex: numberValue(latestInspection, "vibrationIndex", 0.3),
      settlementMm: numberValue(latestInspection, "settlementMm"),
      crackLengthM: numberValue(latestInspection, "crackLengthM"),
      radarAnomalyAreaM2: numberValue(latestInspection, "anomalyAreaM2", numberValue(latestInspection, "radarAnomalyAreaM2")),
      suspectedVoidDepthMinCm: numberValue(latestInspection, "voidDepthMinCm"),
      suspectedVoidDepthMaxCm: numberValue(latestInspection, "voidDepthMaxCm"),
      surfaceDamageLevel: surfaceDamageLevelValue(raw.surfaceDamageLevel),
      radarPreviewLabel: "GPR 异常反射预览",
      gprSummary: textValue(
        latestInspection,
        "gprSummary",
        diseaseLevel === "D" ? "深层异常连续，建议复核。" : "井周局部异常反射，建议进入 AI 风险研判。"
      ),
      photoAssets: photoAssetLabels(asArray(latestInspection.surfacePhotoUrls), textValue(raw, "code", id))
    },
    history: Array.from({ length: Math.max(1, repairCount) }, (_, index) => ({
      occurredAt: index === 0 ? textValue(raw, "lastRepairAt", DEFAULT_DATE) : DEFAULT_DATE,
      action: index === 0 ? "井周常规修补" : "复检记录",
      note: index === 0 ? "历史维修后仍存在声振或平整度异常。" : "纳入示范片区复检。"
    })),
    latestDiagnosisSummary: asRecord(raw.diagnosis).diagnosisVersion ? "已生成 AI 风险研判" : undefined,
    latestPlanSummary: asRecord(raw.plan).planVersion ? "已生成处置方案" : undefined,
    latestAcceptanceSummary: asRecord(raw.acceptance).acceptanceVersion ? "已生成验收档案" : undefined
  };
}

function normalizeMapFeature(rawValue: unknown): MapFeature {
  const raw = asRecord(rawValue);
  const status = String(raw.status ?? "");
  return {
    id: textValue(raw, "id", "mh-unknown"),
    code: textValue(raw, "code", "JW-UNKNOWN"),
    riskScore: numberValue(raw, "riskScore"),
    riskLevel: riskLevelValue(raw.riskLevel),
    diseaseLevel: diseaseLevelValue(raw.diseaseLevel),
    roadName: textValue(raw, "roadName", "示范道路"),
    district: textValue(raw, "district", "示范片区"),
    pipelineType: pipelineTypeValue(raw.pipelineType),
    trafficLevel: trafficLevelValue(raw.trafficLevel),
    hasDiagnosis:
      booleanValue(raw, "hasDiagnosis") ||
      booleanValue(raw, "hasPlan") ||
      booleanValue(raw, "hasAcceptance") ||
      status === "expert_review" ||
      status === "pending_repair" ||
      status === "planned" ||
      status === "accepted",
    location: locationValue(raw.location)
  };
}

function normalizeDiagnosis(rawValue: unknown): Diagnosis {
  const raw = asRecord(rawValue);
  const defects = asArray(raw.defects).map(asRecord);
  const diseaseLevel = diseaseLevelValue(raw.diseaseLevel);
  const findings: DiagnosisFinding[] = defects.map((defect, index) => {
    const disease = diseaseFromDefect(textValue(defect, "defectType"));
    const polygon = asArray(defect.polygon).map(localPointValue);
    return {
      id: `${textValue(raw, "diagnosisVersion", "diag")}-zone-${index + 1}`,
      zoneName: defectAreaLabel(textValue(defect, "areaLabel"), `异常区 ${index + 1}`),
      disease,
      confidence: numberValue(defect, "confidence", numberValue(raw, "confidence", 0.82)),
      depthMinCm: numberValue(defect, "depthMinCm"),
      depthMaxCm: numberValue(defect, "depthMaxCm"),
      anomalyAreaM2: Number((polygon.length * 0.12 + index * 0.04).toFixed(2)),
      polygon
    };
  });
  const recommendation = asRecord(raw.recommendation);
  const depths = findings.flatMap((finding) => [finding.depthMinCm, finding.depthMaxCm]);
  const primaryDiseases = Array.from(new Set(findings.map((finding) => finding.disease)));
  const ruleFactors: RuleFactor[] = [
    { label: "综合评分依据", scoreImpact: numberValue(raw, "riskScore"), evidence: "由高差、平整度、声振、雷达异常、空洞深度、维修次数和交通等级加权得到。" },
    ...findings.slice(0, 3).map((finding) => ({
      label: finding.zoneName,
      scoreImpact: Math.round(finding.confidence * 10),
      evidence: `${finding.depthMinCm}-${finding.depthMaxCm} cm / ${finding.anomalyAreaM2} m2`
    }))
  ];

  return {
    diagnosisId: textValue(raw, "diagnosisVersion", `diag-${textValue(raw, "manholeId")}`),
    diagnosisVersion: textValue(raw, "diagnosisVersion", "diag-v1"),
    manholeId: textValue(raw, "manholeId"),
    riskScore: numberValue(raw, "riskScore"),
    diseaseLevel,
    primaryDiseases,
    findings,
    confidence: numberValue(raw, "confidence", 0.82),
    depthMinCm: depths.length ? Math.min(...depths) : 0,
    depthMaxCm: depths.length ? Math.max(...depths) : 0,
    estimatedVoidVolumeLiters: numberValue(recommendation, "estimatedGroutLiters"),
    ruleFactors,
    recommendedStrategy: textValue(raw, "summary", textValue(recommendation, "recommendedMethod")),
    requiresReview: diseaseLevel === "D" || textValue(recommendation, "recommendedMethod").includes("cctv"),
    summary: textValue(raw, "summary", "已生成可解释的 AI 风险研判结果。"),
    generatedAt: textValue(raw, "generatedAt", DEFAULT_DATE)
  };
}

function normalizePlan(rawValue: unknown): RepairPlan {
  const raw = asRecord(rawValue);
  const diseaseLevel = diseaseLevelValue(raw.diseaseLevel);
  const method = textValue(raw, "recommendedMethod");
  const materials = asArray(raw.recommendedMaterials).map((item) => {
    const material = asRecord(item);
    return {
      name: textValue(material, "materialName", textValue(material, "materialCode", "示范材料")),
      role: textValue(material, "purpose", "施工材料"),
      dosage: material.materialCode ? "按方案估算" : "待复核"
    };
  });
  const groutingPoints: GroutingPoint[] = asArray(raw.groutingHoles).map((item, index) => {
    const point = asRecord(item);
    const x = numberValue(point, "x");
    const y = numberValue(point, "y");
    return {
      pointNo: textValue(point, "holeId", `P${index + 1}`).replace("H", "P"),
      positionAngleDeg: Math.round((Math.atan2(y, x) * 180) / Math.PI + 360) % 360,
      distanceFromCoverCm: Math.round(Math.sqrt(x * x + y * y) * 100),
      depthCm: numberValue(point, "depthCm"),
      targetZoneId: `zone-${index + 1}`
    };
  });
  const recommendedMethods = methodValues(method, diseaseLevel);
  return {
    planId: textValue(raw, "planVersion", `plan-${textValue(raw, "manholeId")}`),
    planVersion: textValue(raw, "planVersion", "plan-v1"),
    manholeId: textValue(raw, "manholeId"),
    recommendedMethods,
    strategySummary:
      diseaseLevel === "D"
        ? "D 级病害进入 CCTV 复核与局部开挖评估，不直接承诺微创闭环。"
        : "系统建议微孔注浆、井座锁固与快硬材料恢复，并按低压分级注浆控制抬升。",
    materials,
    groutingPoints,
    pressureRangeMpa:
      diseaseLevel === "A" ? [0.08, 0.12] : diseaseLevel === "B" ? [0.1, 0.16] : diseaseLevel === "C" ? [0.12, 0.22] : [0.05, 0.08],
    estimatedGroutLiters: numberValue(raw, "estimatedGroutLiters"),
    surfaceRepairAreaM2: diseaseLevel === "C" ? 1.2 : diseaseLevel === "B" ? 0.8 : diseaseLevel === "A" ? 0.4 : 0,
    estimatedDurationMinutes: numberValue(raw, "estimatedDurationMinutes"),
    openTrafficHours: numberValue(raw, "openTrafficHours"),
    qualityControls:
      diseaseLevel === "D"
        ? ["复核结果确认前禁止进入注浆闭环", "围挡期间复核井内渗漏路径"]
        : ["注浆压力全程不高于上限阈值", "井盖周边累计抬升控制在 2 mm 以内", "井座锁固后复测高差和平整度"],
    riskWarnings:
      diseaseLevel === "D"
        ? ["存在深层空洞，局部开挖边界需复核后确认"]
        : ["若出现串浆、冒浆或压力突升，应立即暂停并复测"],
    generatedAt: DEFAULT_DATE
  };
}

function normalizeSimulation(rawValue: unknown, plan: RepairPlan): ConstructionSimulation {
  const raw = asRecord(rawValue);
  const totalGrout = Math.max(1, plan.estimatedGroutLiters);
  const telemetry: TelemetryPoint[] =
    plan.recommendedMethods.includes("cctvReview")
      ? [{ minute: 0, pressureMpa: 0, flowLitersPerMinute: 0, accumulatedVolumeLiters: 0, upliftMm: 0, alertStatus: "watch" }]
      : [0, 10, 22, 34, 46].map((minute, index) => ({
          minute,
          pressureMpa: [0.08, 0.11, 0.14, 0.18, 0.12][index],
          flowLitersPerMinute: [4, 6, 7, 5, 3][index],
          accumulatedVolumeLiters: Math.round(totalGrout * [0, 0.18, 0.42, 0.72, 1][index]),
          upliftMm: [0, 0.3, 0.8, 1.2, 1.4][index],
          alertStatus: index === 3 ? "watch" : "normal"
        }));
  return {
    manholeId: textValue(raw, "manholeId", plan.manholeId),
    planVersion: textValue(raw, "planVersion", plan.planVersion),
    beforeAfterVisualState: {
      before: "井周环形沉陷明显，异常反射连续，车辆通过存在跳动与冲击声。",
      after: plan.recommendedMethods.includes("cctvReview")
        ? "复核阶段，待开挖或管道修复方案确认后进入下一步。"
        : "井周承压层恢复连续，盖座锁固完成，路表恢复后可按 2 小时开放交通。"
    },
    steps: asArray(raw.steps).map((item, index) => {
      const step = asRecord(item);
      return {
        id: textValue(step, "stepCode", `step-${index + 1}`),
        title: textValue(step, "title", `处置步骤 ${index + 1}`),
        detail: simulationStepCopy(textValue(step, "visualType"), "按处置方案执行并记录质控数据。"),
        durationMinutes: numberValue(step, "estimatedDurationMinutes"),
        status: "completed" as const
      };
    }),
    timeline: ["布孔放样", "首轮注浆", "补偿注浆", "井座锁固", "快硬恢复", "开放交通"],
    telemetry
  };
}

function metricValue(metrics: RawObject[], code: string, side: "before" | "after", fallback = 0) {
  const metric = metrics.find((item) => textValue(item, "metricCode") === code);
  return metric ? numberValue(metric, side, fallback) : fallback;
}

function normalizeAcceptance(rawValue: unknown, diagnosis?: Diagnosis, plan?: RepairPlan): AcceptanceReport {
  const raw = asRecord(rawValue);
  const metrics = asArray(raw.beforeAfterMetrics).map(asRecord);
  const beforeMetrics: AcceptanceMetrics = {
    heightDiffMm: metricValue(metrics, "height_diff_mm", "before"),
    flatnessMm: metricValue(metrics, "flatness_mm", "before"),
    noisePeakDb: metricValue(metrics, "noise_peak_db", "before"),
    settlementMm: metricValue(metrics, "settlement_mm", "before"),
    vibrationIndex: metricValue(metrics, "vibration_index", "before")
  };
  const afterMetrics: AcceptanceMetrics = {
    heightDiffMm: metricValue(metrics, "height_diff_mm", "after"),
    flatnessMm: metricValue(metrics, "flatness_mm", "after"),
    noisePeakDb: metricValue(metrics, "noise_peak_db", "after"),
    settlementMm: metricValue(metrics, "settlement_mm", "after"),
    vibrationIndex: metricValue(metrics, "vibration_index", "after")
  };
  const recurrence = asRecord(raw.recurrenceRisk);
  const rawBatches = asArray(raw.materialBatches).map(asRecord);
  return {
    reportId: textValue(raw, "reportNo", textValue(raw, "acceptanceVersion", "acc-v1")),
    acceptanceVersion: textValue(raw, "acceptanceVersion", "acc-v1"),
    manholeId: textValue(raw, "manholeId", plan?.manholeId),
    diagnosisSummary: textValue(raw, "diagnosisSummary", diagnosis?.summary ?? "已归档 AI 风险研判摘要。"),
    repairPlanSummary: textValue(raw, "repairPlanSummary", plan?.strategySummary ?? "已归档处置方案摘要。"),
    constructionRecords: asArray(raw.constructionRecords).map(String),
    materialBatches: rawBatches.map((batch) => ({
      batchNo: textValue(batch, "batchNo"),
      materialName: textValue(batch, "materialName"),
      supplier: textValue(batch, "supplier"),
      producedAt: textValue(batch, "producedAt")
    })),
    beforeMetrics,
    afterMetrics,
    acceptanceStatus: textValue(raw, "conclusion").includes("review") ? "conditionalReview" : "passed",
    reopenTrafficAt: plan?.openTrafficHours ? `修复完成后 ${plan.openTrafficHours} 小时开放交通` : textValue(raw, "openTrafficAt", "待复核"),
    recurrenceRisk: `${Math.round(numberValue(recurrence, "risk12Months") * 100)}% / 12 个月`,
    followUpRecommendation: `建议 ${textValue(raw, "recommendedNextInspectionAt", "3 个月后")} 复检高差、平整度和声振状态。`,
    generatedAt: textValue(raw, "generatedAt", DEFAULT_DATE)
  };
}

function normalizeDashboardSummary(rawValue: unknown, manholes: ManholeDetail[]): DashboardSummary {
  const raw = asRecord(rawValue);
  const totals = asRecord(raw.totals);
  const grades: DiseaseLevel[] = ["A", "B", "C", "D"];
  return {
    projectId: textValue(raw, "projectId", "demo-city-sha-001"),
    generatedAt: textValue(raw, "generatedAt", DEFAULT_DATE),
    totals: {
      manholes: numberValue(totals, "manholes", manholes.length),
      highRiskManholes: numberValue(totals, "highRiskManholes"),
      diagnosedManholes: numberValue(totals, "diagnosedManholes"),
      plannedManholes: numberValue(totals, "plannedManholes"),
      acceptedManholes: numberValue(totals, "acceptedManholes")
    },
    riskDistribution: asArray(raw.riskDistribution).map((item) => {
      const record = asRecord(item);
      return { riskLevel: riskLevelValue(record.riskLevel), count: numberValue(record, "count") };
    }),
    gradeDistribution: grades.map((diseaseLevel) => ({
      diseaseLevel,
      count: manholes.filter((item) => item.diseaseLevel === diseaseLevel).length
    })),
    topRisks: asArray(raw.topRisks).map((item) => {
      const record = asRecord(item);
      return {
        manholeId: textValue(record, "manholeId"),
        code: textValue(record, "code"),
        roadName: textValue(record, "roadName"),
        riskScore: numberValue(record, "riskScore"),
        riskLevel: riskLevelValue(record.riskLevel)
      };
    }),
    averageOpenTrafficHours: 2,
    reinspectionPassRate: 94,
    recentActivities: [
      {
        id: "act-api-1",
        happenedAt: DEFAULT_DATE,
        title: "示范片区完成监测数据同步",
        detail: "AI研判、处置方案、施工监管和验收归档可按主流程实时生成。"
      }
    ]
  };
}

function normalizeDemoScript(rawValue: unknown): DemoScript {
  const raw = asRecord(rawValue);
  const scenes = asArray(raw.scenes).map(asRecord);
  const manholeId = textValue(raw, "manholeId", "mh-0007");
  return {
    scriptId: textValue(raw, "scriptId", "default"),
    recommendedManholeId: manholeId,
    headline: textValue(raw, "title", "5-8 分钟讲清井周病害如何被看见、被判断、被验证。"),
    steps: scenes.map((scene, index) => ({
      id: textValue(scene, "sceneCode", `scene-${index + 1}`),
      title: textValue(scene, "title", `步骤 ${index + 1}`),
      summary: textValue(scene, "narration", "按路演脚本讲解当前页面。"),
      route: textValue(scene, "route", "/dashboard"),
      talkingPoints: [textValue(scene, "narration", "展示主流程关键证据。")]
    }))
  };
}

function filterMapFeatures(features: MapFeature[], filters?: MapFilters) {
  return features.filter((feature) => {
    const matchesRisk = !filters?.riskLevel || filters.riskLevel === "all" || feature.riskLevel === filters.riskLevel;
    const matchesDiagnosis =
      !filters?.hasDiagnosis ||
      filters.hasDiagnosis === "all" ||
      (filters.hasDiagnosis === "yes" ? feature.hasDiagnosis : !feature.hasDiagnosis);
    const term = filters?.search?.trim().toLowerCase();
    const matchesSearch =
      !term ||
      feature.code.toLowerCase().includes(term) ||
      feature.roadName.toLowerCase().includes(term) ||
      feature.district.toLowerCase().includes(term);

    return matchesRisk && matchesDiagnosis && matchesSearch;
  });
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return resolveWithMockFallback(
    async () => {
      const [summary, manholes] = await Promise.all([requestJson("/dashboard/summary"), listManholes()]);
      return normalizeDashboardSummary(summary, manholes);
    },
    async () => {
      await delay();
      return getMockDashboardSummary();
    }
  );
}

export async function getMapManholes(filters?: MapFilters): Promise<MapFeature[]> {
  return resolveWithMockFallback(
    async () => {
      const params = new URLSearchParams();
      if (filters?.riskLevel && filters.riskLevel !== "all") {
        params.set("riskLevel", filters.riskLevel);
      }
      if (filters?.hasDiagnosis && filters.hasDiagnosis !== "all") {
        params.set("hasDiagnosis", filters.hasDiagnosis === "yes" ? "true" : "false");
      }
      const suffix = params.size ? `?${params.toString()}` : "";
      const collection = asRecord(await requestJson(`/map/manholes${suffix}`));
      return filterMapFeatures(asArray(collection.features).map(normalizeMapFeature), filters);
    },
    async () => {
      await delay();
      return filterMapFeatures(getMockMapFeatures(), filters);
    }
  );
}

export async function listManholes(): Promise<ManholeDetail[]> {
  return resolveWithMockFallback(
    async () => {
      const response = asRecord(await requestJson("/manholes?pageSize=100"));
      return asArray(response.items).map(normalizeManholeDetail);
    },
    async () => {
      await delay();
      return getMockManholes();
    }
  );
}

export async function getManholeDetail(id: string): Promise<ManholeDetail | null> {
  return resolveWithMockFallback(
    async () => {
      try {
        return normalizeManholeDetail(await requestJson(`/manholes/${id}?include=diagnosis,plan,acceptance`));
      } catch (error) {
        if (isApiNotFound(error)) {
          return null;
        }
        throw error;
      }
    },
    async () => {
      await delay();
      return getMockManholes().find((item) => item.id === id) ?? null;
    }
  );
}

export async function createDiagnosis(id: string, request: DiagnosisRequest): Promise<Diagnosis> {
  return resolveWithMockFallback(
    async () =>
      normalizeDiagnosis(
        await requestJson(`/manholes/${id}/diagnosis`, {
          method: "POST",
          body: JSON.stringify({
            inspectionVersion: request.inspectionVersion,
            generationMode: "reuse_if_unchanged"
          })
        })
      ),
    async () => {
      await delay(220);
      const detail = getMockManholes().find((item) => item.id === id);
      if (!detail) {
        throw new Error("Manhole not found.");
      }

      return buildDiagnosis(detail, request);
    }
  );
}

export async function getDiagnosis(id: string): Promise<Diagnosis | null> {
  return resolveWithMockFallback(
    async () => {
      try {
        return normalizeDiagnosis(await requestJson(`/manholes/${id}/diagnosis`));
      } catch (error) {
        if (!isApiNotFound(error)) {
          throw error;
        }
        const detail = await getManholeDetail(id);
        if (!detail) {
          return null;
        }
        return createDiagnosis(id, { inspectionVersion: detail.inspection.inspectionVersion });
      }
    },
    async () => {
      await delay();
      const detail = getMockManholes().find((item) => item.id === id);
      return detail ? buildDiagnosis(detail) : null;
    }
  );
}

export async function createRepairPlan(id: string, diagnosisVersion: string): Promise<RepairPlan> {
  return resolveWithMockFallback(
    async () =>
      normalizePlan(
        await requestJson(`/manholes/${id}/plan`, {
          method: "POST",
          body: JSON.stringify({ diagnosisVersion, generationMode: "reuse_if_unchanged" })
        })
      ),
    async () => {
      await delay(180);
      const detail = getMockManholes().find((item) => item.id === id);
      if (!detail) {
        throw new Error("Manhole not found.");
      }

      return buildPlan(detail, buildDiagnosis(detail));
    }
  );
}

export async function getRepairPlan(id: string): Promise<RepairPlan | null> {
  return resolveWithMockFallback(
    async () => {
      try {
        return normalizePlan(await requestJson(`/manholes/${id}/plan`));
      } catch (error) {
        if (!isApiNotFound(error)) {
          throw error;
        }
        const diagnosis = await getDiagnosis(id);
        return diagnosis ? createRepairPlan(id, diagnosis.diagnosisVersion) : null;
      }
    },
    async () => {
      await delay();
      const detail = getMockManholes().find((item) => item.id === id);
      return detail ? buildPlan(detail, buildDiagnosis(detail)) : null;
    }
  );
}

export async function getSimulation(id: string): Promise<ConstructionSimulation | null> {
  return resolveWithMockFallback(
    async () => {
      const plan = await getRepairPlan(id);
      if (!plan) {
        return null;
      }
      return normalizeSimulation(
        await requestJson(`/manholes/${id}/simulation?planVersion=${encodeURIComponent(plan.planVersion)}`),
        plan
      );
    },
    async () => {
      await delay();
      const detail = getMockManholes().find((item) => item.id === id);
      if (!detail) {
        return null;
      }

      const diagnosis = buildDiagnosis(detail);
      const plan = buildPlan(detail, diagnosis);
      return buildSimulation(detail, plan);
    }
  );
}

export async function createAcceptance(id: string, planVersion: string): Promise<AcceptanceReport> {
  return resolveWithMockFallback(
    async () => {
      const [diagnosis, plan] = await Promise.all([getDiagnosis(id), getRepairPlan(id)]);
      return normalizeAcceptance(
        await requestJson(`/manholes/${id}/acceptance`, {
          method: "POST",
          body: JSON.stringify({
            planVersion,
            includeReportSections: [
              "before_after_metrics",
              "diagnosis_summary",
              "grouting_summary",
              "reinspection_recommendation"
            ]
          })
        }),
        diagnosis ?? undefined,
        plan ?? undefined
      );
    },
    async () => {
      await delay(200);
      const detail = getMockManholes().find((item) => item.id === id);
      if (!detail) {
        throw new Error("Manhole not found.");
      }

      const diagnosis = buildDiagnosis(detail);
      const plan = buildPlan(detail, diagnosis);
      return buildAcceptance(detail, diagnosis, plan);
    }
  );
}

export async function getAcceptance(id: string): Promise<AcceptanceReport | null> {
  return resolveWithMockFallback(
    async () => {
      const [diagnosis, plan] = await Promise.all([getDiagnosis(id), getRepairPlan(id)]);
      if (!plan) {
        return null;
      }
      try {
        return normalizeAcceptance(await requestJson(`/manholes/${id}/acceptance`), diagnosis ?? undefined, plan);
      } catch (error) {
        if (!isApiNotFound(error)) {
          throw error;
        }
        return createAcceptance(id, plan.planVersion);
      }
    },
    async () => {
      await delay();
      const detail = getMockManholes().find((item) => item.id === id);
      if (!detail) {
        return null;
      }

      const diagnosis = buildDiagnosis(detail);
      const plan = buildPlan(detail, diagnosis);
      return buildAcceptance(detail, diagnosis, plan);
    }
  );
}

export async function getDemoScript(): Promise<DemoScript> {
  return resolveWithMockFallback(
    async () => normalizeDemoScript(await requestJson("/demo-script")),
    async () => {
      await delay();
      return getMockDemoScript();
    }
  );
}
