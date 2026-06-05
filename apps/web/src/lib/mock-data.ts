import {
  AcceptanceReport,
  ConstructionSimulation,
  DashboardSummary,
  DemoScript,
  Diagnosis,
  DiagnosisRequest,
  DiseaseLevel,
  GroutingPoint,
  MapFeature,
  ManholeDetail,
  PipelineType,
  PrimaryDisease,
  RecommendedMethod,
  RepairPlan,
  RiskLevel,
  TrafficLevel
} from "@/lib/types";

const now = "2026-06-02T09:30:00+08:00";
export const DEMO_MANHOLE_ID = "mh-0007";
export const DEMO_MANHOLE_CODE = "JW-A-0007";

type SeedRecord = {
  id: string;
  code: string;
  roadName: string;
  district: string;
  pipeType: PipelineType;
  trafficLevel: TrafficLevel;
  riskScore: number;
  riskLevel: RiskLevel;
  diseaseLevel: DiseaseLevel;
  lon: number;
  lat: number;
  status: ManholeDetail["status"];
  complaintCount: number;
  maintenanceCount: number;
  heightDiffMm: number;
  flatnessMm: number;
  noisePeakDb: number;
  vibrationIndex: number;
  settlementMm: number;
  crackLengthM: number;
  radarAnomalyAreaM2: number;
  depthMinCm: number;
  depthMaxCm: number;
  gprSummary: string;
};

const seeds: SeedRecord[] = [
  {
    id: "mh-0001",
    code: "JW-A-0001",
    roadName: "科创中路",
    district: "东城片区",
    pipeType: "stormWater",
    trafficLevel: "medium",
    riskScore: 28,
    riskLevel: "low",
    diseaseLevel: "A",
    lon: 121.4682,
    lat: 31.2271,
    status: "accepted",
    complaintCount: 0,
    maintenanceCount: 1,
    heightDiffMm: 1,
    flatnessMm: 2.4,
    noisePeakDb: 58,
    vibrationIndex: 0.24,
    settlementMm: 1.3,
    crackLengthM: 0.4,
    radarAnomalyAreaM2: 0.2,
    depthMinCm: 0,
    depthMaxCm: 12,
    gprSummary: "井盖接触面轻微老化，未见深层异常。"
  },
  {
    id: "mh-0002",
    code: "JW-A-0002",
    roadName: "科创中路",
    district: "东城片区",
    pipeType: "sewage",
    trafficLevel: "medium",
    riskScore: 49,
    riskLevel: "medium",
    diseaseLevel: "B",
    lon: 121.4701,
    lat: 31.228,
    status: "diagnosed",
    complaintCount: 1,
    maintenanceCount: 2,
    heightDiffMm: 4,
    flatnessMm: 4.8,
    noisePeakDb: 69,
    vibrationIndex: 0.42,
    settlementMm: 3.1,
    crackLengthM: 1.1,
    radarAnomalyAreaM2: 0.6,
    depthMinCm: 8,
    depthMaxCm: 22,
    gprSummary: "井座周边浅层脱空，建议锁固与快修。"
  },
  {
    id: "mh-0003",
    code: "JW-A-0003",
    roadName: "江湾大道",
    district: "东城片区",
    pipeType: "power",
    trafficLevel: "heavy",
    riskScore: 72,
    riskLevel: "high",
    diseaseLevel: "C",
    lon: 121.4718,
    lat: 31.2265,
    status: "planned",
    complaintCount: 2,
    maintenanceCount: 2,
    heightDiffMm: 7,
    flatnessMm: 6.8,
    noisePeakDb: 79,
    vibrationIndex: 0.61,
    settlementMm: 5.5,
    crackLengthM: 1.8,
    radarAnomalyAreaM2: 1.1,
    depthMinCm: 14,
    depthMaxCm: 36,
    gprSummary: "井周基层松散，南侧伴随局部脱空。"
  },
  {
    id: "mh-0004",
    code: "JW-A-0004",
    roadName: "港城支路",
    district: "港务片区",
    pipeType: "telecom",
    trafficLevel: "light",
    riskScore: 41,
    riskLevel: "medium",
    diseaseLevel: "B",
    lon: 121.4669,
    lat: 31.2291,
    status: "undiagnosed",
    complaintCount: 0,
    maintenanceCount: 1,
    heightDiffMm: 3,
    flatnessMm: 4.1,
    noisePeakDb: 66,
    vibrationIndex: 0.36,
    settlementMm: 2.3,
    crackLengthM: 0.8,
    radarAnomalyAreaM2: 0.4,
    depthMinCm: 6,
    depthMaxCm: 18,
    gprSummary: "井座承压圈边缘存在浅层异常反射。"
  },
  {
    id: "mh-0005",
    code: "JW-A-0005",
    roadName: "港城支路",
    district: "港务片区",
    pipeType: "stormWater",
    trafficLevel: "heavy",
    riskScore: 91,
    riskLevel: "critical",
    diseaseLevel: "D",
    lon: 121.4648,
    lat: 31.2284,
    status: "diagnosed",
    complaintCount: 3,
    maintenanceCount: 3,
    heightDiffMm: 11,
    flatnessMm: 9.2,
    noisePeakDb: 86,
    vibrationIndex: 0.79,
    settlementMm: 8.9,
    crackLengthM: 2.6,
    radarAnomalyAreaM2: 1.8,
    depthMinCm: 28,
    depthMaxCm: 70,
    gprSummary: "井周深层空洞伴随水损，建议 CCTV 复核。"
  },
  {
    id: "mh-0006",
    code: "JW-A-0006",
    roadName: "江湾大道",
    district: "东城片区",
    pipeType: "sewage",
    trafficLevel: "heavy",
    riskScore: 63,
    riskLevel: "high",
    diseaseLevel: "C",
    lon: 121.4729,
    lat: 31.2294,
    status: "planned",
    complaintCount: 2,
    maintenanceCount: 2,
    heightDiffMm: 6,
    flatnessMm: 6.2,
    noisePeakDb: 76,
    vibrationIndex: 0.58,
    settlementMm: 4.9,
    crackLengthM: 1.5,
    radarAnomalyAreaM2: 1,
    depthMinCm: 16,
    depthMaxCm: 40,
    gprSummary: "井周一米范围内基层支撑不足。"
  },
  {
    id: DEMO_MANHOLE_ID,
    code: "JW-A-0007",
    roadName: "科技大道",
    district: "示范片区",
    pipeType: "stormWater",
    trafficLevel: "heavy",
    riskScore: 86,
    riskLevel: "high",
    diseaseLevel: "C",
    lon: 121.4737,
    lat: 31.2304,
    status: "accepted",
    complaintCount: 4,
    maintenanceCount: 3,
    heightDiffMm: 8,
    flatnessMm: 7.5,
    noisePeakDb: 82,
    vibrationIndex: 0.73,
    settlementMm: 6.6,
    crackLengthM: 2.4,
    radarAnomalyAreaM2: 1.4,
    depthMinCm: 12,
    depthMaxCm: 45,
    gprSummary: "井周基层松散伴随东南侧局部脱空，井座存在松动风险。"
  },
  {
    id: "mh-0008",
    code: "JW-A-0008",
    roadName: "科技大道",
    district: "示范片区",
    pipeType: "power",
    trafficLevel: "heavy",
    riskScore: 77,
    riskLevel: "high",
    diseaseLevel: "C",
    lon: 121.4754,
    lat: 31.2311,
    status: "diagnosed",
    complaintCount: 2,
    maintenanceCount: 2,
    heightDiffMm: 7,
    flatnessMm: 6.9,
    noisePeakDb: 80,
    vibrationIndex: 0.66,
    settlementMm: 5.7,
    crackLengthM: 2.1,
    radarAnomalyAreaM2: 1.2,
    depthMinCm: 10,
    depthMaxCm: 38,
    gprSummary: "井周西侧存在连续松散区，建议微孔注浆。"
  },
  {
    id: "mh-0009",
    code: "JW-A-0009",
    roadName: "科技大道",
    district: "示范片区",
    pipeType: "sewage",
    trafficLevel: "medium",
    riskScore: 55,
    riskLevel: "medium",
    diseaseLevel: "B",
    lon: 121.4728,
    lat: 31.2325,
    status: "diagnosed",
    complaintCount: 1,
    maintenanceCount: 1,
    heightDiffMm: 4,
    flatnessMm: 5.2,
    noisePeakDb: 71,
    vibrationIndex: 0.47,
    settlementMm: 3.4,
    crackLengthM: 0.9,
    radarAnomalyAreaM2: 0.7,
    depthMinCm: 8,
    depthMaxCm: 18,
    gprSummary: "井盖承压面与浅层结构层存在轻度脱空。"
  },
  {
    id: "mh-0010",
    code: "JW-A-0010",
    roadName: "科技大道",
    district: "示范片区",
    pipeType: "stormWater",
    trafficLevel: "light",
    riskScore: 35,
    riskLevel: "low",
    diseaseLevel: "A",
    lon: 121.4707,
    lat: 31.2314,
    status: "undiagnosed",
    complaintCount: 0,
    maintenanceCount: 0,
    heightDiffMm: 2,
    flatnessMm: 3.1,
    noisePeakDb: 62,
    vibrationIndex: 0.28,
    settlementMm: 1.8,
    crackLengthM: 0.5,
    radarAnomalyAreaM2: 0.3,
    depthMinCm: 0,
    depthMaxCm: 10,
    gprSummary: "未见明显深层异常，需常规巡检。"
  },
  {
    id: "mh-0011",
    code: "JW-B-0011",
    roadName: "环城西路",
    district: "西城片区",
    pipeType: "telecom",
    trafficLevel: "medium",
    riskScore: 45,
    riskLevel: "medium",
    diseaseLevel: "B",
    lon: 121.4627,
    lat: 31.2261,
    status: "undiagnosed",
    complaintCount: 1,
    maintenanceCount: 1,
    heightDiffMm: 4,
    flatnessMm: 4.4,
    noisePeakDb: 67,
    vibrationIndex: 0.39,
    settlementMm: 2.8,
    crackLengthM: 0.8,
    radarAnomalyAreaM2: 0.5,
    depthMinCm: 8,
    depthMaxCm: 20,
    gprSummary: "浅层病害为主，建议锁固与快修。"
  },
  {
    id: "mh-0012",
    code: "JW-B-0012",
    roadName: "环城西路",
    district: "西城片区",
    pipeType: "stormWater",
    trafficLevel: "heavy",
    riskScore: 82,
    riskLevel: "high",
    diseaseLevel: "C",
    lon: 121.4614,
    lat: 31.2278,
    status: "planned",
    complaintCount: 3,
    maintenanceCount: 2,
    heightDiffMm: 8,
    flatnessMm: 7,
    noisePeakDb: 81,
    vibrationIndex: 0.67,
    settlementMm: 6.1,
    crackLengthM: 2.2,
    radarAnomalyAreaM2: 1.3,
    depthMinCm: 14,
    depthMaxCm: 42,
    gprSummary: "井周环状松散明显，局部脱空风险高。"
  },
  {
    id: "mh-0013",
    code: "JW-B-0013",
    roadName: "环城西路",
    district: "西城片区",
    pipeType: "other",
    trafficLevel: "light",
    riskScore: 31,
    riskLevel: "low",
    diseaseLevel: "A",
    lon: 121.4599,
    lat: 31.2292,
    status: "accepted",
    complaintCount: 0,
    maintenanceCount: 1,
    heightDiffMm: 1,
    flatnessMm: 2.6,
    noisePeakDb: 60,
    vibrationIndex: 0.25,
    settlementMm: 1.5,
    crackLengthM: 0.3,
    radarAnomalyAreaM2: 0.2,
    depthMinCm: 0,
    depthMaxCm: 8,
    gprSummary: "仅见表层轻微磨耗。"
  },
  {
    id: "mh-0014",
    code: "JW-B-0014",
    roadName: "滨河东路",
    district: "滨河片区",
    pipeType: "power",
    trafficLevel: "medium",
    riskScore: 58,
    riskLevel: "medium",
    diseaseLevel: "B",
    lon: 121.4762,
    lat: 31.2249,
    status: "diagnosed",
    complaintCount: 2,
    maintenanceCount: 1,
    heightDiffMm: 5,
    flatnessMm: 5.4,
    noisePeakDb: 72,
    vibrationIndex: 0.46,
    settlementMm: 3.7,
    crackLengthM: 1.0,
    radarAnomalyAreaM2: 0.7,
    depthMinCm: 10,
    depthMaxCm: 22,
    gprSummary: "井座松动和浅层脱空叠加。"
  },
  {
    id: "mh-0015",
    code: "JW-B-0015",
    roadName: "滨河东路",
    district: "滨河片区",
    pipeType: "sewage",
    trafficLevel: "heavy",
    riskScore: 93,
    riskLevel: "critical",
    diseaseLevel: "D",
    lon: 121.4777,
    lat: 31.2267,
    status: "diagnosed",
    complaintCount: 4,
    maintenanceCount: 3,
    heightDiffMm: 12,
    flatnessMm: 9.6,
    noisePeakDb: 88,
    vibrationIndex: 0.84,
    settlementMm: 9.4,
    crackLengthM: 2.9,
    radarAnomalyAreaM2: 2,
    depthMinCm: 30,
    depthMaxCm: 76,
    gprSummary: "深层空洞与疑似渗漏通道并存。"
  },
  {
    id: "mh-0016",
    code: "JW-B-0016",
    roadName: "滨河东路",
    district: "滨河片区",
    pipeType: "stormWater",
    trafficLevel: "medium",
    riskScore: 67,
    riskLevel: "high",
    diseaseLevel: "C",
    lon: 121.4785,
    lat: 31.2281,
    status: "planned",
    complaintCount: 2,
    maintenanceCount: 2,
    heightDiffMm: 6,
    flatnessMm: 6.6,
    noisePeakDb: 77,
    vibrationIndex: 0.59,
    settlementMm: 5.3,
    crackLengthM: 1.6,
    radarAnomalyAreaM2: 1.1,
    depthMinCm: 14,
    depthMaxCm: 35,
    gprSummary: "井周承载层松散，建议环向注浆。"
  },
  {
    id: "mh-0017",
    code: "JW-C-0017",
    roadName: "城运路",
    district: "北部片区",
    pipeType: "telecom",
    trafficLevel: "light",
    riskScore: 38,
    riskLevel: "low",
    diseaseLevel: "A",
    lon: 121.4686,
    lat: 31.2336,
    status: "undiagnosed",
    complaintCount: 0,
    maintenanceCount: 0,
    heightDiffMm: 2,
    flatnessMm: 3.4,
    noisePeakDb: 61,
    vibrationIndex: 0.31,
    settlementMm: 1.9,
    crackLengthM: 0.4,
    radarAnomalyAreaM2: 0.2,
    depthMinCm: 0,
    depthMaxCm: 8,
    gprSummary: "轻微表层病害。"
  },
  {
    id: "mh-0018",
    code: "JW-C-0018",
    roadName: "城运路",
    district: "北部片区",
    pipeType: "power",
    trafficLevel: "medium",
    riskScore: 61,
    riskLevel: "high",
    diseaseLevel: "C",
    lon: 121.4709,
    lat: 31.2341,
    status: "planned",
    complaintCount: 2,
    maintenanceCount: 2,
    heightDiffMm: 6,
    flatnessMm: 6.1,
    noisePeakDb: 74,
    vibrationIndex: 0.54,
    settlementMm: 4.8,
    crackLengthM: 1.4,
    radarAnomalyAreaM2: 0.9,
    depthMinCm: 12,
    depthMaxCm: 34,
    gprSummary: "井周浅中层脱空与松散并存。"
  },
  {
    id: "mh-0019",
    code: "JW-C-0019",
    roadName: "城运路",
    district: "北部片区",
    pipeType: "stormWater",
    trafficLevel: "heavy",
    riskScore: 89,
    riskLevel: "critical",
    diseaseLevel: "D",
    lon: 121.4731,
    lat: 31.2344,
    status: "diagnosed",
    complaintCount: 3,
    maintenanceCount: 2,
    heightDiffMm: 10,
    flatnessMm: 8.7,
    noisePeakDb: 84,
    vibrationIndex: 0.78,
    settlementMm: 8,
    crackLengthM: 2.5,
    radarAnomalyAreaM2: 1.9,
    depthMinCm: 26,
    depthMaxCm: 64,
    gprSummary: "深层异常反射连续，需退出微创闭环。"
  },
  {
    id: "mh-0020",
    code: "JW-C-0020",
    roadName: "城运路",
    district: "北部片区",
    pipeType: "sewage",
    trafficLevel: "medium",
    riskScore: 53,
    riskLevel: "medium",
    diseaseLevel: "B",
    lon: 121.4749,
    lat: 31.2331,
    status: "diagnosed",
    complaintCount: 1,
    maintenanceCount: 1,
    heightDiffMm: 4,
    flatnessMm: 5,
    noisePeakDb: 70,
    vibrationIndex: 0.44,
    settlementMm: 3.2,
    crackLengthM: 1,
    radarAnomalyAreaM2: 0.6,
    depthMinCm: 8,
    depthMaxCm: 20,
    gprSummary: "井盖承压体系有轻微松动。"
  }
];

function makeHistory(record: SeedRecord) {
  return [
    {
      occurredAt: "2025-07-18T21:30:00+08:00",
      action: "环缝应急修补",
      note: "仅处理表层裂缝，未进入结构层。"
    },
    {
      occurredAt: "2025-12-04T10:20:00+08:00",
      action: "井盖调平复查",
      note: `维修后 ${record.complaintCount} 个月内出现再次异响投诉。`
    }
  ].slice(0, Math.max(1, Math.min(2, record.maintenanceCount)));
}

export function getMockMapFeatures(): MapFeature[] {
  return seeds.map((record) => ({
    id: record.id,
    code: record.code,
    riskScore: record.riskScore,
    riskLevel: record.riskLevel,
    diseaseLevel: record.diseaseLevel,
    roadName: record.roadName,
    district: record.district,
    pipelineType: record.pipeType,
    trafficLevel: record.trafficLevel,
    hasDiagnosis: record.status !== "undiagnosed",
    location: {
      lon: record.lon,
      lat: record.lat
    }
  }));
}

export function getMockManholes(): ManholeDetail[] {
  return seeds.map((record) => ({
    id: record.id,
    code: record.code,
    roadName: record.roadName,
    district: record.district,
    pipeType: record.pipeType,
    manholeType: "圆形车行道检查井",
    coverType: "球墨铸铁防沉降井盖",
    trafficLevel: record.trafficLevel,
    owner: "市政道路养护中心",
    location: {
      lon: record.lon,
      lat: record.lat
    },
    riskScore: record.riskScore,
    riskLevel: record.riskLevel,
    diseaseLevel: record.diseaseLevel,
    lastInspectedAt: "2026-05-29T14:10:00+08:00",
    lastRepairedAt: "2025-12-04T10:20:00+08:00",
    complaintCount: record.complaintCount,
    maintenanceCount: record.maintenanceCount,
    status: record.status,
    inspection: {
      inspectionVersion: `insp-${record.id}-v1`,
      inspectedAt: "2026-05-29T14:10:00+08:00",
      heightDiffMm: record.heightDiffMm,
      flatnessMm: record.flatnessMm,
      noisePeakDb: record.noisePeakDb,
      vibrationIndex: record.vibrationIndex,
      settlementMm: record.settlementMm,
      crackLengthM: record.crackLengthM,
      radarAnomalyAreaM2: record.radarAnomalyAreaM2,
      suspectedVoidDepthMinCm: record.depthMinCm,
      suspectedVoidDepthMaxCm: record.depthMaxCm,
      surfaceDamageLevel:
        record.diseaseLevel === "A"
          ? "minor"
          : record.diseaseLevel === "B"
            ? "moderate"
            : "severe",
      radarPreviewLabel: `${record.roadName} ${record.code} 雷达剖面`,
      gprSummary: record.gprSummary,
      photoAssets: [
        `${record.code} 井盖正视`,
        `${record.code} 井周裂缝`,
        `${record.code} 雷达扫测点位`
      ]
    },
    history: makeHistory(record)
  }));
}

const diseaseLabels: Record<PrimaryDisease, string> = {
  void: "局部脱空",
  looseBase: "基层松散",
  debonding: "层间脱空",
  waterDamage: "水损",
  frameLooseness: "井座松动",
  shaftDefect: "井筒缺陷"
};

const methodLabels: Record<RecommendedMethod, string> = {
  coverLocking: "井座锁固",
  microGrouting: "微孔注浆",
  ringCutRepair: "局部环切修复",
  fastHardMaterial: "快硬材料恢复",
  cctvReview: "CCTV 复核",
  localExcavation: "局部开挖"
};

const pipelineLabels: Record<PipelineType, string> = {
  stormWater: "雨水",
  sewage: "污水",
  power: "电力",
  telecom: "通信",
  other: "其他"
};

const trafficLabels: Record<TrafficLevel, string> = {
  light: "轻载",
  medium: "中载",
  heavy: "重载"
};

const workflowStatusLabels: Record<ManholeDetail["status"], string> = {
  undiagnosed: "待研判",
  diagnosed: "已研判",
  planned: "已派单",
  accepted: "已归档"
};

function toConfidence(value: number) {
  return Math.min(0.97, Number((0.72 + value / 1000).toFixed(2)));
}

function findingPolygon(index: number) {
  const polygons = [
    [
      { x: 0.55, y: -0.1 },
      { x: 0.88, y: 0.06 },
      { x: 0.72, y: 0.34 },
      { x: 0.44, y: 0.18 }
    ],
    [
      { x: -0.88, y: -0.18 },
      { x: -0.54, y: -0.28 },
      { x: -0.32, y: 0.18 },
      { x: -0.72, y: 0.28 }
    ],
    [
      { x: -0.12, y: -0.82 },
      { x: 0.22, y: -0.68 },
      { x: 0.15, y: -0.34 },
      { x: -0.24, y: -0.42 }
    ]
  ];

  return polygons[index] ?? polygons[0];
}

function buildFindings(detail: ManholeDetail) {
  const baseDiseases: Record<DiseaseLevel, PrimaryDisease[]> = {
    A: ["frameLooseness"],
    B: ["frameLooseness", "debonding"],
    C: ["looseBase", "void", "frameLooseness"],
    D: ["void", "waterDamage", "shaftDefect"]
  };

  return baseDiseases[detail.diseaseLevel].map((disease, index) => ({
    id: `zone-${detail.id}-${index + 1}`,
    zoneName:
      detail.diseaseLevel === "D" && index === 0
        ? "井周深层空洞带"
        : ["东南侧异常区", "西侧松散区", "井座周边风险圈"][index] ?? "异常区",
    disease,
    confidence: toConfidence(detail.riskScore - index * 3),
    depthMinCm: Math.max(0, detail.inspection.suspectedVoidDepthMinCm - index * 6),
    depthMaxCm:
      detail.inspection.suspectedVoidDepthMaxCm - (index === 2 ? 18 : index * 7),
    anomalyAreaM2: Number(
      (detail.inspection.radarAnomalyAreaM2 * (index === 0 ? 0.42 : index === 1 ? 0.36 : 0.22)).toFixed(2)
    ),
    polygon: findingPolygon(index)
  }));
}

function buildRuleFactors(detail: ManholeDetail) {
  return [
    {
      label: "井盖高差",
      scoreImpact: Math.min(18, detail.inspection.heightDiffMm * 2),
      evidence: `${detail.inspection.heightDiffMm} mm 高差`
    },
    {
      label: "声振异常",
      scoreImpact: Math.min(21, Math.round((detail.inspection.noisePeakDb - 55) / 2)),
      evidence: `${detail.inspection.noisePeakDb} dB 峰值`
    },
    {
      label: "雷达异常面积",
      scoreImpact: Math.min(28, Math.round(detail.inspection.radarAnomalyAreaM2 * 15)),
      evidence: `${detail.inspection.radarAnomalyAreaM2} m2`
    },
    {
      label: "沉陷与历史投诉",
      scoreImpact: Math.min(
        20,
        Math.round(detail.inspection.settlementMm + detail.complaintCount * 2)
      ),
      evidence: `${detail.inspection.settlementMm} mm / ${detail.complaintCount} 次投诉`
    }
  ];
}

export function buildDiagnosis(
  detail: ManholeDetail,
  request?: DiagnosisRequest
): Diagnosis {
  void request;
  const findings = buildFindings(detail);
  const summaryByLevel: Record<DiseaseLevel, string> = {
    A: "井盖接触面轻微老化，建议锁固调平并纳入常规复检。",
    B: "井座周边浅层脱空与承压面松动叠加，适合锁固与环形快修。",
    C: "井周基层松散伴随局部脱空，建议微孔注浆、井座锁固和快硬材料恢复。",
    D: "检测到深层空洞或水损通道，需 CCTV 复核并评估局部开挖，不建议直接闭环微创。"
  };

  return {
    diagnosisId: `diag-${detail.id}`,
    diagnosisVersion: `diag-${detail.id}-v1`,
    manholeId: detail.id,
    riskScore: detail.riskScore,
    diseaseLevel: detail.diseaseLevel,
    primaryDiseases: findings.map((finding) => finding.disease),
    findings,
    confidence: toConfidence(detail.riskScore + 8),
    depthMinCm: detail.inspection.suspectedVoidDepthMinCm,
    depthMaxCm: detail.inspection.suspectedVoidDepthMaxCm,
    estimatedVoidVolumeLiters: Number(
      (detail.inspection.radarAnomalyAreaM2 * (detail.diseaseLevel === "D" ? 36 : 24)).toFixed(1)
    ),
    ruleFactors: buildRuleFactors(detail),
    recommendedStrategy: summaryByLevel[detail.diseaseLevel],
    requiresReview: detail.diseaseLevel === "D",
    summary: summaryByLevel[detail.diseaseLevel],
    generatedAt: now
  };
}

function pointRing(count: number, depth: number, targetZoneId: string): GroutingPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    pointNo: `P${index + 1}`,
    positionAngleDeg: Math.round((360 / count) * index),
    distanceFromCoverCm: index % 2 === 0 ? 42 : 58,
    depthCm: depth + (index % 3) * 4,
    targetZoneId
  }));
}

export function buildPlan(detail: ManholeDetail, diagnosis: Diagnosis): RepairPlan {
  const methodsByLevel: Record<DiseaseLevel, RecommendedMethod[]> = {
    A: ["coverLocking", "fastHardMaterial"],
    B: ["coverLocking", "ringCutRepair", "fastHardMaterial"],
    C: ["microGrouting", "coverLocking", "fastHardMaterial"],
    D: ["cctvReview", "localExcavation"]
  };

  const materials =
    detail.diseaseLevel === "D"
      ? [
          {
            name: "井内 CCTV 复核",
            role: "确认渗漏与结构破坏边界",
            dosage: "1 套"
          },
          {
            name: "局部开挖恢复材料包",
            role: "退出微创后备用",
            dosage: "按复核结果"
          }
        ]
      : [
          {
            name: "可控扩散型微细注浆料",
            role: "填充脱空与加固松散基层",
            dosage: `${Math.max(18, Math.round(diagnosis.estimatedVoidVolumeLiters * 0.9))} L`
          },
          {
            name: "快硬低收缩水泥基复合材料",
            role: "井座承压层恢复",
            dosage: `${(detail.diseaseLevel === "B" ? 0.5 : 1.2).toFixed(1)} m3`
          },
          {
            name: "防震响橡胶圈及限位件",
            role: "盖座锁固与消除跳动异响",
            dosage: "1 套"
          }
        ];

  return {
    planId: `plan-${detail.id}`,
    planVersion: `plan-${detail.id}-v1`,
    manholeId: detail.id,
    recommendedMethods: methodsByLevel[detail.diseaseLevel],
    strategySummary:
      detail.diseaseLevel === "D"
        ? "保留交通安全围挡，先完成 CCTV 复核与局部开挖判定。"
        : `${methodsByLevel[detail.diseaseLevel].map((method) => methodLabels[method]).join(" + ")}，控制低压分级注浆并同步监测路面抬升。`,
    materials,
    groutingPoints:
      detail.diseaseLevel === "D"
        ? []
        : pointRing(detail.diseaseLevel === "B" ? 6 : detail.diseaseLevel === "A" ? 4 : 8, detail.inspection.suspectedVoidDepthMinCm + 10, diagnosis.findings[0]?.id ?? "zone-1"),
    pressureRangeMpa:
      detail.diseaseLevel === "A"
        ? [0.08, 0.12]
        : detail.diseaseLevel === "B"
          ? [0.1, 0.16]
          : detail.diseaseLevel === "C"
            ? [0.12, 0.22]
            : [0.05, 0.08],
    estimatedGroutLiters:
      detail.diseaseLevel === "D"
        ? 0
        : Math.max(18, Math.round(diagnosis.estimatedVoidVolumeLiters * 0.95)),
    surfaceRepairAreaM2:
      detail.diseaseLevel === "A"
        ? 0.4
        : detail.diseaseLevel === "B"
          ? 0.8
          : detail.diseaseLevel === "C"
            ? 1.2
            : 0,
    estimatedDurationMinutes:
      detail.diseaseLevel === "A"
        ? 45
        : detail.diseaseLevel === "B"
          ? 75
          : detail.diseaseLevel === "C"
            ? 110
            : 90,
    openTrafficHours: detail.diseaseLevel === "D" ? 0 : 2,
    qualityControls:
      detail.diseaseLevel === "D"
        ? ["复核结果确认前禁止进入注浆闭环", "围挡期间复核井内渗漏路径"]
        : [
            "注浆压力全程不高于上限阈值",
            "井盖周边累计抬升控制在 2 mm 以内",
            "井座锁固后复测高差和平整度"
          ],
    riskWarnings:
      detail.diseaseLevel === "D"
        ? ["存在深层空洞，局部开挖边界需复核后确认"]
        : ["若出现串浆、冒浆或压力突升，应立即暂停并复测"]
        ,
    generatedAt: now
  };
}

export function buildSimulation(
  detail: ManholeDetail,
  plan: RepairPlan
): ConstructionSimulation {
  const totalGrout = plan.estimatedGroutLiters;

  return {
    manholeId: detail.id,
    planVersion: plan.planVersion,
    beforeAfterVisualState: {
      before: "井周环形沉陷明显，东南侧异常反射连续，车辆通过存在跳动与冲击声。",
      after:
        detail.diseaseLevel === "D"
          ? "复核阶段，待开挖或管道修复方案确认后进入下一步。"
          : "井周承压层恢复连续，盖座锁固完成，路表恢复后可按 2 小时开放交通。"
    },
    steps: [
      {
        id: "drilling",
        title: "精准布孔",
        detail: "按井周异常区环向布设注浆孔位，避开井筒和管线接口。",
        durationMinutes: detail.diseaseLevel === "D" ? 20 : 18,
        status: "completed"
      },
      {
        id: "staged-grouting",
        title: "低压分级注浆",
        detail:
          detail.diseaseLevel === "D"
            ? "复核确认前暂停注浆。"
            : "采用小流量、多轮次、低压分级注浆，实时监测压力与抬升。",
        durationMinutes: detail.diseaseLevel === "D" ? 0 : 46,
        status: detail.diseaseLevel === "D" ? "pending" : "completed"
      },
      {
        id: "frame-locking",
        title: "井座锁固与调平",
        detail: "更换防震响构件，校正井盖标高并恢复承压面连续性。",
        durationMinutes: 20,
        status: detail.diseaseLevel === "D" ? "pending" : "completed"
      },
      {
        id: "fast-recovery",
        title: "快硬材料恢复",
        detail: "完成表层快修并进入开放交通倒计时。",
        durationMinutes: detail.diseaseLevel === "D" ? 0 : 26,
        status: detail.diseaseLevel === "D" ? "pending" : "active"
      }
    ],
    timeline:
      detail.diseaseLevel === "D"
        ? ["现场围挡", "井内 CCTV 复核", "确认渗漏边界", "评估局部开挖"]
        : ["布孔放样", "首轮注浆", "补偿注浆", "井座锁固", "快硬恢复", "开放交通"],
    telemetry:
      detail.diseaseLevel === "D"
        ? [
            {
              minute: 0,
              pressureMpa: 0,
              flowLitersPerMinute: 0,
              accumulatedVolumeLiters: 0,
              upliftMm: 0,
              alertStatus: "watch"
            }
          ]
        : [
            {
              minute: 0,
              pressureMpa: 0.08,
              flowLitersPerMinute: 4,
              accumulatedVolumeLiters: 0,
              upliftMm: 0,
              alertStatus: "normal"
            },
            {
              minute: 10,
              pressureMpa: 0.11,
              flowLitersPerMinute: 6,
              accumulatedVolumeLiters: Math.round(totalGrout * 0.18),
              upliftMm: 0.3,
              alertStatus: "normal"
            },
            {
              minute: 22,
              pressureMpa: 0.14,
              flowLitersPerMinute: 7,
              accumulatedVolumeLiters: Math.round(totalGrout * 0.42),
              upliftMm: 0.8,
              alertStatus: "normal"
            },
            {
              minute: 34,
              pressureMpa: 0.18,
              flowLitersPerMinute: 5,
              accumulatedVolumeLiters: Math.round(totalGrout * 0.72),
              upliftMm: 1.2,
              alertStatus: "watch"
            },
            {
              minute: 46,
              pressureMpa: 0.12,
              flowLitersPerMinute: 3,
              accumulatedVolumeLiters: totalGrout,
              upliftMm: 1.4,
              alertStatus: "normal"
            }
          ]
  };
}

export function buildAcceptance(
  detail: ManholeDetail,
  diagnosis: Diagnosis,
  plan: RepairPlan
): AcceptanceReport {
  const before = {
    heightDiffMm: detail.inspection.heightDiffMm,
    flatnessMm: detail.inspection.flatnessMm,
    noisePeakDb: detail.inspection.noisePeakDb,
    settlementMm: detail.inspection.settlementMm,
    vibrationIndex: detail.inspection.vibrationIndex
  };

  const after =
    detail.diseaseLevel === "D"
      ? before
      : {
          heightDiffMm: Math.max(1, Math.round(before.heightDiffMm * 0.25)),
          flatnessMm: Number(Math.max(2.2, before.flatnessMm * 0.34).toFixed(1)),
          noisePeakDb: Math.max(56, Math.round(before.noisePeakDb - 18)),
          settlementMm: Number(Math.max(1.1, before.settlementMm * 0.28).toFixed(1)),
          vibrationIndex: Number(Math.max(0.18, before.vibrationIndex * 0.42).toFixed(2))
        };

  return {
    reportId: `acc-${detail.id}`,
    acceptanceVersion: `acc-${detail.id}-v1`,
    manholeId: detail.id,
    diagnosisSummary: diagnosis.summary,
    repairPlanSummary: plan.strategySummary,
    constructionRecords:
      detail.diseaseLevel === "D"
        ? ["已完成安全围挡", "已发起 CCTV 复核", "待复核结果确定退出工法"]
        : [
            "已完成 8 点布孔与首轮注浆",
            `累计注浆 ${plan.estimatedGroutLiters} L，抬升控制在 1.4 mm 内`,
            "已完成井座锁固、调平与快硬材料恢复"
          ],
    materialBatches:
      detail.diseaseLevel === "D"
        ? [
            {
              batchNo: "RV-CCTV-20260602",
              materialName: "CCTV 复核服务单",
              supplier: "示范片区养护队",
              producedAt: "2026-06-02"
            }
          ]
        : [
            {
              batchNo: "MG-20260602-07",
              materialName: "可控扩散型微细注浆料",
              supplier: "示范路养材中心",
              producedAt: "2026-06-02"
            },
            {
              batchNo: "FH-20260602-03",
              materialName: "快硬低收缩水泥基复合材料",
              supplier: "示范路养材中心",
              producedAt: "2026-06-02"
            }
          ],
    beforeMetrics: before,
    afterMetrics: after,
    acceptanceStatus: detail.diseaseLevel === "D" ? "conditionalReview" : "passed",
    reopenTrafficAt: detail.diseaseLevel === "D" ? "待复核" : "处置完成后 2 小时开放交通",
    recurrenceRisk: detail.diseaseLevel === "D" ? "高" : detail.diseaseLevel === "C" ? "中低" : "低",
    followUpRecommendation:
      detail.diseaseLevel === "D"
        ? "完成 CCTV 与局部开挖复核后 24 小时内更新正式方案。"
        : "建议 3 / 6 / 12 个月复检，重点复测高差、平整度和声振状态。",
    generatedAt: now
  };
}

export function getMockDashboardSummary(): DashboardSummary {
  const manholes = getMockManholes();
  const byRisk: RiskLevel[] = ["low", "medium", "high", "critical"];
  const byGrade: DiseaseLevel[] = ["A", "B", "C", "D"];

  return {
    projectId: "demo-city-sha-001",
    generatedAt: now,
    totals: {
      manholes: manholes.length,
      highRiskManholes: manholes.filter((item) => item.riskLevel === "high" || item.riskLevel === "critical").length,
      diagnosedManholes: manholes.filter((item) => item.status !== "undiagnosed").length,
      plannedManholes: manholes.filter((item) => item.status === "planned" || item.status === "accepted").length,
      acceptedManholes: manholes.filter((item) => item.status === "accepted").length
    },
    riskDistribution: byRisk.map((riskLevel) => ({
      riskLevel,
      count: manholes.filter((item) => item.riskLevel === riskLevel).length
    })),
    gradeDistribution: byGrade.map((diseaseLevel) => ({
      diseaseLevel,
      count: manholes.filter((item) => item.diseaseLevel === diseaseLevel).length
    })),
    topRisks: [...manholes]
      .sort((left, right) => right.riskScore - left.riskScore)
      .slice(0, 5)
      .map((item) => ({
        manholeId: item.id,
        code: item.code,
        roadName: item.roadName,
        riskScore: item.riskScore,
        riskLevel: item.riskLevel
      })),
    averageOpenTrafficHours: 2,
    reinspectionPassRate: 94,
    recentActivities: [
      {
        id: "act-1",
        happenedAt: "2026-06-02T08:45:00+08:00",
        title: "示范片区完成 1 井验收",
        detail: "JW-A-0007 完成注浆与井座锁固，开放交通倒计时已启动。"
      },
      {
        id: "act-2",
        happenedAt: "2026-06-02T08:10:00+08:00",
        title: "港务片区触发 D 级复核",
        detail: "JW-A-0005 检测到深层空洞，系统转入 CCTV 复核分支。"
      },
      {
        id: "act-3",
        happenedAt: "2026-06-01T19:40:00+08:00",
        title: "环城西路完成夜间快修",
        detail: "JW-B-0012 用时 108 分钟完成微创修复。"
      }
    ]
  };
}

export function getMockDemoScript(): DemoScript {
  return {
    scriptId: "demo-script-v1",
    recommendedManholeId: DEMO_MANHOLE_ID,
    headline: "5-8 分钟讲清谛听如何完成全域监测、AI研判、工单处置和验收归档。",
    steps: [
      {
        id: "step-dashboard",
        title: "监测总览",
        summary: "先从全域管井监测、告警和工单闭环切入，说明这是一套管理平台。",
        route: "/dashboard",
        talkingPoints: ["纳管管井", "今日告警", "待处置工单", "闭环达标率"]
      },
      {
        id: "step-map",
        title: "GIS 定位二级橙色告警井",
        summary: "切到 JW-A-0007，展示告警等级、管线类型和资产底座。",
        route: "/map",
        talkingPoints: ["三级告警色", "管线类型", "监测来源", "处置状态"]
      },
      {
        id: "step-detail",
        title: "一井一档说明为什么处置",
        summary: "展示监测指标、巡检影像、雷达预览和历史处置记录。",
        route: `/manholes/${DEMO_MANHOLE_ID}`,
        talkingPoints: ["井盖高差", "平整度", "声振异常", "雷达异常面积", "当前工单状态"]
      },
      {
        id: "step-diagnosis",
        title: "AI 风险研判看见地下病害",
        summary: "自动跑完研判动画，展示热力区、异常深度和评分依据。",
        route: `/manholes/${DEMO_MANHOLE_ID}/diagnosis?autorun=1`,
        talkingPoints: ["C 级病害", "基层松散 + 局部脱空", "综合评分依据", "处置建议"]
      },
      {
        id: "step-plan",
        title: "处置方案自动转工单",
        summary: "强调系统把研判结果转成可执行工法、材料、孔位和开放交通目标。",
        route: `/manholes/${DEMO_MANHOLE_ID}/plan`,
        talkingPoints: ["孔位数量", "压力范围", "注浆量", "开放交通时间"]
      },
      {
        id: "step-simulation",
        title: "施工监管说明微创过程",
        summary: "按四步走完处置过程，突出平台可监管、可回放、非大开挖。 ",
        route: `/manholes/${DEMO_MANHOLE_ID}/simulation`,
        talkingPoints: ["精准布孔", "低压分级注浆", "井座锁固调平", "快硬恢复", "过程遥测"]
      },
      {
        id: "step-acceptance",
        title: "验收归档形成一井一档",
        summary: "展示处置前后指标对比、材料批次、归档入口和复检建议。",
        route: `/manholes/${DEMO_MANHOLE_ID}/acceptance`,
        talkingPoints: ["平整度对比", "声振对比", "材料批次", "3/6/12 月复检"]
      }
    ]
  };
}

export function getDiseaseLabel(disease: PrimaryDisease) {
  return diseaseLabels[disease];
}

export function getMethodLabel(method: RecommendedMethod) {
  return methodLabels[method];
}

export function getPipelineLabel(pipeline: PipelineType) {
  return pipelineLabels[pipeline];
}

export function getTrafficLabel(traffic: TrafficLevel) {
  return trafficLabels[traffic];
}

export function getWorkflowStatusLabel(status: ManholeDetail["status"]) {
  return workflowStatusLabels[status];
}
