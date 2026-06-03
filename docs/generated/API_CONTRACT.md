# API Contract

## 1. 目标与范围

本合同定义“井周智修”Demo 的后端 API 边界，用于支撑以下主流程：

```text
/dashboard
  -> /map
  -> /manholes/{id}
  -> /manholes/{id}/diagnosis
  -> /manholes/{id}/plan
  -> /manholes/{id}/simulation
  -> /manholes/{id}/acceptance
  -> /demo-script
```

本稿只定义 API 合同与 OpenAPI 草案，不涉及业务代码、数据库实现或 AI 规则实现。

基础约束：
- Base path: `/api/v1`
- Media type: `application/json`
- 时间格式: RFC 3339
- API 字段命名: `camelCase`
- 数据库可使用 `snake_case`，但不得直接透出到 API

## 2. Actor Flow 与边界

### 2.1 参与方

| Actor | 读取 | 触发写入 | 所属边界 |
| --- | --- | --- | --- |
| Dashboard 页面 | `dashboard summary` | 无 | 聚合视图层 |
| Map 页面 | `map manhole features` | 无 | 地图投影视图层 |
| 单井详情页面 | `manhole detail` | 无 | 资产与检测快照层 |
| AI 诊断页面 | `diagnosis` | `POST diagnosis` | 诊断派生层 |
| 维修方案页面 | `repair plan` | `POST plan` | 决策派生层 |
| 施工模拟页面 | `simulation` | 无 | 计划投影层 |
| 验收报告页面 | `acceptance report` | `POST acceptance` | 报告派生层 |
| 路演模式页面 | `demo script` | 无 | 演示编排层 |

### 2.2 资源归属原则

- `manholes` 是核心主资源，承载资产、当前位置、当前风险概览和最新检测摘要。
- `diagnosis`、`plan`、`acceptance` 是挂在单井下的派生单例资源，不直接暴露数据库表结构。
- `simulation` 是对当前 `plan` 的只读投影，不单独建“施工日志写接口”，避免把 Demo 页面的静态演示过早绑定为生产施工系统。
- `dashboard`、`map`、`demo-script` 是只读视图资源，不反向承载资产写入。

## 3. 合同层级设计

### 3.1 核心资源模型

| 资源 | 标识 | 说明 |
| --- | --- | --- |
| `DashboardSummary` | tenant + project + filter | `/dashboard` 首页聚合指标 |
| `MapManholeFeatureCollection` | tenant + viewport/filter | `/map` 地图点位与简化属性 |
| `Manhole` | `manholeId` | 单井资产主资源 |
| `InspectionSnapshot` | `inspectionVersion` | 单井最新检测快照，只在明细中嵌入 |
| `Diagnosis` | `manholeId` + `diagnosisVersion` | 当前诊断结果单例 |
| `RepairPlan` | `manholeId` + `planVersion` | 当前维修方案单例 |
| `Simulation` | `manholeId` + `planVersion` | 当前施工模拟只读投影 |
| `AcceptanceReport` | `manholeId` + `acceptanceVersion` | 当前验收报告单例 |
| `DemoScript` | `scriptId` | 路演步骤编排 |

### 3.2 为何不做“大一统单接口”

不建议用一个 `/api/v1/manholes/{id}/full-demo` 返回详情、诊断、方案、施工、验收全部内容。原因：

- 所有页面生命周期不同，强行耦合会导致缓存和失效策略混乱。
- 诊断、方案、验收有明确前置依赖，拆分后更容易表达 `409 PRECONDITION_REQUIRED`。
- 未来从 Demo 升级到生产时，诊断和验收最可能先异步化；若一开始做成“全量大对象”，后续破坏性变更会更大。

## 4. 全局合同规则

### 4.1 标识与版本

- `id` 字段统一使用字符串，避免前后端语言对大整数处理不一致。
- 资源版本字段显式暴露：
  - `inspectionVersion`
  - `diagnosisVersion`
  - `planVersion`
  - `acceptanceVersion`
- 派生资源生成请求必须带上上游版本，避免 UI 在过期详情页上触发旧数据生成。

### 4.2 坐标与几何

地图与诊断图形必须分开建模：

- 地图定位使用 `WGS84` 经纬度：`location.lon`, `location.lat`
- 诊断 polygon、热力图、注浆孔位使用井周局部平面坐标：
  - `coordinateSpace = local_manhole_plane`
  - 原点默认是井盖中心
  - 单位默认是米

前端不得把诊断 polygon 直接绘制到城市地图上，必须先经过坐标空间判断。

### 4.3 数值与单位

单位直接体现在字段名中，避免 UI 猜测：

- `heightDiffMm`
- `flatnessMm`
- `depthMinCm`
- `depthMaxCm`
- `anomalyAreaM2`
- `noisePeakDb`
- `estimatedGroutLiters`
- `pressureMpa`
- `estimatedDurationMinutes`
- `openTrafficHours`

### 4.4 可选性与空值

- 能返回空集合的字段返回 `[]`，不返回 `null`
- 真正未知或未生成的数据，用字段缺省表示，不用 `null`
- 仅在业务上“有值但可为空”的极少数字段才允许 `null`；本 MVP 草案中默认不使用 `null`

### 4.5 可观测性

所有响应应返回：

- `X-Request-Id`: 服务端生成或透传的相关性 ID
- 失败响应体中的 `error.correlationId`

对可缓存读取接口建议返回：

- `ETag`
- `Last-Modified`

## 5. 端点清单

| Method | Path | 用途 | 页面 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/dashboard/summary` | 首页指标聚合 | `/dashboard` |
| `GET` | `/api/v1/map/manholes` | 地图点位视图 | `/map` |
| `GET` | `/api/v1/manholes` | 单井列表与检索 | 地图侧栏、列表 |
| `GET` | `/api/v1/manholes/{manholeId}` | 单井详情 | `/manholes/{id}` |
| `POST` | `/api/v1/manholes/{manholeId}/diagnosis` | 生成或复用当前诊断 | `/manholes/{id}/diagnosis` |
| `GET` | `/api/v1/manholes/{manholeId}/diagnosis` | 获取当前诊断 | `/manholes/{id}/diagnosis` |
| `POST` | `/api/v1/manholes/{manholeId}/plan` | 基于诊断生成或复用方案 | `/manholes/{id}/plan` |
| `GET` | `/api/v1/manholes/{manholeId}/plan` | 获取当前方案 | `/manholes/{id}/plan` |
| `GET` | `/api/v1/manholes/{manholeId}/simulation` | 获取施工模拟 | `/manholes/{id}/simulation` |
| `POST` | `/api/v1/manholes/{manholeId}/acceptance` | 生成或复用验收报告 | `/manholes/{id}/acceptance` |
| `GET` | `/api/v1/manholes/{manholeId}/acceptance` | 获取当前验收报告 | `/manholes/{id}/acceptance` |
| `GET` | `/api/v1/demo-script` | 获取路演脚本 | `/demo-script` |

## 6. 关键操作合同

### 6.1 `GET /api/v1/dashboard/summary`

用途：
- 为总览页提供 KPI、风险分布、待处置清单和趋势摘要。

请求参数：
- `projectId` 可选
- `roadId` 可选
- `updatedSince` 可选，RFC 3339

成功响应示例：

```json
{
  "projectId": "demo-city-sha-001",
  "generatedAt": "2026-06-02T18:30:00Z",
  "totals": {
    "manholes": 20,
    "highRiskManholes": 6,
    "diagnosedManholes": 8,
    "plannedManholes": 6,
    "acceptedManholes": 4
  },
  "riskDistribution": [
    { "riskLevel": "low", "count": 5 },
    { "riskLevel": "medium", "count": 7 },
    { "riskLevel": "high", "count": 5 },
    { "riskLevel": "critical", "count": 3 }
  ],
  "topRisks": [
    {
      "manholeId": "mh-0007",
      "code": "JW-A-0007",
      "roadName": "科技大道",
      "riskScore": 86,
      "riskLevel": "high"
    }
  ]
}
```

失败响应示例：

```json
{
  "error": {
    "code": "FILTER_INVALID",
    "message": "updatedSince must be an RFC 3339 timestamp.",
    "details": [
      { "field": "updatedSince", "issue": "invalid_format" }
    ],
    "correlationId": "req_01JY5Y3W2S2W5FJ4A0K6T2N1VQ"
  }
}
```

### 6.2 `GET /api/v1/map/manholes`

用途：
- 为地图页返回 Geo-view 点位与最小必要属性。

过滤参数：
- `bbox=minLon,minLat,maxLon,maxLat` 可选但推荐
- `projectId`
- `riskLevel`
- `pipelineType`
- `trafficLevel`
- `hasDiagnosis`
- `limit`，默认 `500`，最大 `1000`

成功响应示例：

```json
{
  "coordinateReferenceSystem": "WGS84",
  "features": [
    {
      "id": "mh-0007",
      "code": "JW-A-0007",
      "riskScore": 86,
      "riskLevel": "high",
      "diseaseLevel": "C",
      "roadName": "科技大道",
      "pipelineType": "storm_water",
      "location": { "lon": 121.4737, "lat": 31.2304 }
    }
  ],
  "meta": {
    "count": 1,
    "limit": 500
  }
}
```

失败响应示例：

```json
{
  "error": {
    "code": "FILTER_INVALID",
    "message": "bbox must contain four comma-separated numbers.",
    "details": [
      { "field": "bbox", "issue": "invalid_bbox" }
    ],
    "correlationId": "req_01JY5Y4MN0D6N4MVPJ4T8YV8AA"
  }
}
```

### 6.3 `GET /api/v1/manholes/{manholeId}`

用途：
- 返回单井详情页需要的主档案、最新检测摘要和可导航链接。

请求参数：
- `include=diagnosis,plan,acceptance` 可选

成功响应示例：

```json
{
  "id": "mh-0007",
  "code": "JW-A-0007",
  "projectId": "demo-city-sha-001",
  "roadId": "road-keji-ave",
  "roadName": "科技大道",
  "location": { "lon": 121.4737, "lat": 31.2304 },
  "manholeType": "storm_water",
  "pipelineType": "storm_water",
  "trafficLevel": "heavy",
  "status": "pending_repair",
  "riskScore": 86,
  "riskLevel": "high",
  "lastRepairAt": "2025-12-14T10:00:00Z",
  "repairCount": 3,
  "latestInspection": {
    "inspectionId": "insp-0007-v3",
    "inspectionVersion": "v3",
    "inspectedAt": "2026-05-28T09:30:00Z",
    "heightDiffMm": -8,
    "flatnessMm": 7.5,
    "noisePeakDb": 82,
    "crackLengthM": 2.4,
    "anomalyAreaM2": 1.4,
    "voidDepthMinCm": 12,
    "voidDepthMaxCm": 45,
    "surfacePhotoUrls": [
      "https://example.invalid/assets/mh-0007-1.jpg"
    ]
  },
  "links": {
    "diagnosis": "/api/v1/manholes/mh-0007/diagnosis",
    "plan": "/api/v1/manholes/mh-0007/plan",
    "simulation": "/api/v1/manholes/mh-0007/simulation",
    "acceptance": "/api/v1/manholes/mh-0007/acceptance"
  }
}
```

失败响应示例：

```json
{
  "error": {
    "code": "MANHOLE_NOT_FOUND",
    "message": "Manhole mh-9999 was not found.",
    "details": [],
    "correlationId": "req_01JY5Y5X9Q0T7Q0S5W4DR9H79J"
  }
}
```

### 6.4 `POST /api/v1/manholes/{manholeId}/diagnosis`

用途：
- 基于指定检测版本触发当前诊断生成。

请求体：

```json
{
  "inspectionVersion": "v3",
  "generationMode": "reuse_if_unchanged"
}
```

请求约束：
- 建议携带 `Idempotency-Key`
- `inspectionVersion` 必填
- `generationMode` 枚举：
  - `reuse_if_unchanged`
  - `force_recompute`

成功响应示例：

```json
{
  "manholeId": "mh-0007",
  "diagnosisVersion": "diag-v3-r1",
  "inspectionVersion": "v3",
  "generationStatus": "created",
  "generatedAt": "2026-06-02T18:31:00Z",
  "riskScore": 86,
  "riskLevel": "high",
  "diseaseLevel": "C",
  "confidence": 0.9,
  "summary": "井周基层松散伴随局部脱空，建议微孔注浆和井座锁固。",
  "defects": [
    {
      "defectType": "void",
      "areaLabel": "southeast",
      "depthMinCm": 12,
      "depthMaxCm": 28,
      "confidence": 0.92,
      "coordinateSpace": "local_manhole_plane",
      "polygon": [[0.3, -0.2], [0.8, -0.1], [0.7, -0.6], [0.2, -0.5]]
    }
  ],
  "heatmapCells": [
    { "x": 0.4, "y": -0.3, "radiusM": 0.25, "intensity": 0.92 }
  ],
  "recommendation": {
    "recommendedMethod": "micro_grouting_plus_seat_locking_plus_fast_set_restore",
    "openTrafficHours": 2,
    "estimatedGroutLiters": 42,
    "groutingHoleCount": 8
  }
}
```

失败响应示例：

```json
{
  "error": {
    "code": "CONFLICTING_SOURCE_VERSION",
    "message": "Inspection version v2 is not the latest available version for manhole mh-0007.",
    "details": [
      {
        "field": "inspectionVersion",
        "issue": "stale_version",
        "currentVersion": "v3"
      }
    ],
    "correlationId": "req_01JY5Y7QW8M0T4M9Q2Q7J0T2E9"
  }
}
```

### 6.5 `POST /api/v1/manholes/{manholeId}/plan`

用途：
- 基于诊断版本生成维修方案。

请求体：

```json
{
  "diagnosisVersion": "diag-v3-r1",
  "generationMode": "reuse_if_unchanged"
}
```

成功响应示例：

```json
{
  "manholeId": "mh-0007",
  "planVersion": "plan-diag-v3-r1-r1",
  "diagnosisVersion": "diag-v3-r1",
  "generationStatus": "created",
  "diseaseLevel": "C",
  "recommendedMethod": "micro_grouting_plus_seat_locking_plus_fast_set_restore",
  "recommendedMaterials": [
    {
      "materialCode": "MAT-GROUT-01",
      "materialName": "可控扩散型微细注浆料",
      "purpose": "fill_voids_and_strengthen_base"
    },
    {
      "materialCode": "MAT-FASTSET-01",
      "materialName": "快硬低收缩水泥基复合材料",
      "purpose": "restore_surface_bearing_ring"
    }
  ],
  "groutingHoles": [
    { "holeId": "H1", "x": 0.45, "y": 0.25, "depthCm": 35, "estimatedGroutLiters": 5.8 }
  ],
  "estimatedDurationMinutes": 110,
  "openTrafficHours": 2,
  "estimatedGroutLiters": 42,
  "expectedGarbageReductionPercent": 60
}
```

失败响应示例：

```json
{
  "error": {
    "code": "PRECONDITION_REQUIRED",
    "message": "Repair plan cannot be generated before a diagnosis exists.",
    "details": [
      {
        "field": "diagnosisVersion",
        "issue": "missing_dependency",
        "dependency": "diagnosis"
      }
    ],
    "correlationId": "req_01JY5Y8Q5H2D3QDTK9HX6W4V6G"
  }
}
```

### 6.6 `GET /api/v1/manholes/{manholeId}/simulation`

用途：
- 为施工模拟页提供步骤、动态参数、前后对比目标值。

请求参数：
- `planVersion` 可选，不传默认取当前方案

成功响应示例：

```json
{
  "manholeId": "mh-0007",
  "planVersion": "plan-diag-v3-r1-r1",
  "coordinateSpace": "local_manhole_plane",
  "steps": [
    {
      "stepCode": "layout_holes",
      "title": "精准布孔",
      "sequence": 1,
      "estimatedDurationMinutes": 15,
      "visualType": "hole_layout",
      "metrics": {
        "holeCount": 8
      }
    },
    {
      "stepCode": "pressure_grouting",
      "title": "低压分级注浆",
      "sequence": 2,
      "estimatedDurationMinutes": 45,
      "visualType": "grout_diffusion",
      "metrics": {
        "targetPressureMpa": 0.25,
        "targetGroutLiters": 42,
        "maxSurfaceLiftMm": 1.0
      }
    }
  ],
  "targetOutcomes": {
    "flatnessAfterMm": 2.4,
    "heightDiffAfterMm": -2,
    "noiseStatus": "no_obvious_abnormal_impact_sound",
    "openTrafficHours": 2
  }
}
```

失败响应示例：

```json
{
  "error": {
    "code": "PRECONDITION_REQUIRED",
    "message": "Simulation is unavailable until a repair plan exists.",
    "details": [
      {
        "field": "planVersion",
        "issue": "missing_dependency",
        "dependency": "plan"
      }
    ],
    "correlationId": "req_01JY5YA0Q7T4P5G6R8S9U1V2WX"
  }
}
```

### 6.7 `POST /api/v1/manholes/{manholeId}/acceptance`

用途：
- 基于当前方案生成验收报告。

请求体：

```json
{
  "planVersion": "plan-diag-v3-r1-r1",
  "includeReportSections": [
    "before_after_metrics",
    "diagnosis_summary",
    "grouting_summary",
    "reinspection_recommendation"
  ]
}
```

成功响应示例：

```json
{
  "manholeId": "mh-0007",
  "acceptanceVersion": "acc-plan-diag-v3-r1-r1-r1",
  "planVersion": "plan-diag-v3-r1-r1",
  "reportNo": "ACC-20260602-0007",
  "generatedAt": "2026-06-02T18:34:00Z",
  "conclusion": "accepted_with_quantified_targets_met",
  "beforeAfterMetrics": [
    { "metricCode": "flatness_mm", "before": 7.5, "after": 2.4, "target": 3.0, "unit": "mm" },
    { "metricCode": "height_diff_mm", "before": -8, "after": -2, "target": -2, "unit": "mm" }
  ],
  "noiseConclusion": "验收状态下无明显跳动、空响和异常冲击声",
  "openTrafficAt": "2026-06-02T20:34:00Z",
  "recurrenceRisk": {
    "risk3Months": 0.18,
    "risk6Months": 0.24,
    "risk12Months": 0.31
  },
  "recommendedNextInspectionAt": "2026-09-02T00:00:00Z"
}
```

失败响应示例：

```json
{
  "error": {
    "code": "PRECONDITION_REQUIRED",
    "message": "Acceptance report cannot be generated before a repair plan exists.",
    "details": [
      {
        "field": "planVersion",
        "issue": "missing_dependency",
        "dependency": "plan"
      }
    ],
    "correlationId": "req_01JY5YB3MHN3Q8WXXT06GJ5F0M"
  }
}
```

### 6.8 `GET /api/v1/demo-script`

用途：
- 为固定路演模式返回步骤、旁白、聚焦井位和跳转路由。

请求参数：
- `scriptId` 可选，默认 `default`
- `audience` 可选：`executive` / `technical`

成功响应示例：

```json
{
  "scriptId": "default",
  "audience": "executive",
  "title": "井周智修客户路演脚本",
  "manholeId": "mh-0007",
  "scenes": [
    {
      "sceneCode": "map_intro",
      "sequence": 1,
      "route": "/map",
      "title": "城市道路风险地图",
      "narration": "我们现在选择这座红色高风险检查井。",
      "focus": {
        "manholeId": "mh-0007"
      }
    },
    {
      "sceneCode": "diagnosis_result",
      "sequence": 2,
      "route": "/manholes/mh-0007/diagnosis",
      "title": "AI 诊断结果",
      "narration": "系统识别为 C 级病害，建议微孔注浆和井座锁固。"
    }
  ]
}
```

失败响应示例：

```json
{
  "error": {
    "code": "SCRIPT_NOT_FOUND",
    "message": "Demo script advanced-english was not found.",
    "details": [],
    "correlationId": "req_01JY5YCB5A4VK4ZC5E4V8JHZ9P"
  }
}
```

## 7. 分页、过滤、排序、部分响应

### 7.1 `GET /api/v1/manholes`

该接口用于列表检索，而不是地图渲染。

查询参数：
- `pageSize`，默认 `20`，最大 `100`
- `pageToken`，游标分页
- `projectId`
- `roadId`
- `riskLevel`
- `diseaseLevel`
- `pipelineType`
- `trafficLevel`
- `status`
- `sort`，格式示例：`riskScore:desc,lastInspectionAt:desc`

返回结构：

```json
{
  "items": [],
  "page": {
    "pageSize": 20,
    "nextPageToken": "opaque-token"
  }
}
```

### 7.2 地图接口为何不分页

`GET /api/v1/map/manholes` 是 viewport 驱动的地图投影视图，分页会导致地图缩放和拖拽行为复杂化，因此：

- 采用 `bbox + limit`
- 超限时由后端裁剪或聚合
- 未来生产版可增加 `cluster=true`

### 7.3 部分响应策略

MVP 不引入通用 `fields[...]` 稀疏字段机制，避免前后端复杂度过高。仅支持：

- `include=diagnosis,plan,acceptance` 用于单井详情页按需内联轻量摘要
- 地图与列表分别走独立视图资源

## 8. 错误模型

统一错误结构：

```json
{
  "error": {
    "code": "PRECONDITION_REQUIRED",
    "message": "Repair plan cannot be generated before a diagnosis exists.",
    "details": [
      {
        "field": "diagnosisVersion",
        "issue": "missing_dependency"
      }
    ],
    "correlationId": "req_01JY..."
  }
}
```

### 8.1 稳定错误码

| HTTP | code | 用途 |
| --- | --- | --- |
| `400` | `FILTER_INVALID` | 查询参数不合法 |
| `401` | `AUTH_REQUIRED` | 缺少有效身份 |
| `403` | `FORBIDDEN` | 无权访问该项目/租户 |
| `404` | `MANHOLE_NOT_FOUND` | 单井不存在 |
| `404` | `DIAGNOSIS_NOT_FOUND` | 当前诊断不存在 |
| `404` | `PLAN_NOT_FOUND` | 当前方案不存在 |
| `404` | `ACCEPTANCE_NOT_FOUND` | 当前验收报告不存在 |
| `404` | `SCRIPT_NOT_FOUND` | 路演脚本不存在 |
| `409` | `PRECONDITION_REQUIRED` | 缺前置资源 |
| `409` | `CONFLICTING_SOURCE_VERSION` | 传入版本已过期 |
| `409` | `IDEMPOTENCY_KEY_REUSED` | 同 key 不同 payload |
| `422` | `UNPROCESSABLE_INPUT` | 业务上无法处理的输入 |
| `503` | `MOCK_DATA_INCOMPLETE` | Demo 种子数据不完整 |

## 9. 幂等、重试与前置条件

### 9.1 幂等语义

以下接口属于“生成当前派生单例资源”的写操作：

- `POST /manholes/{id}/diagnosis`
- `POST /manholes/{id}/plan`
- `POST /manholes/{id}/acceptance`

合同要求：

- 前端应发送 `Idempotency-Key`
- 后端按 `tenant + path + idempotencyKey` 去重
- 同 key 同 payload：
  - 首次成功返回 `201 Created`
  - 重试成功可返回 `200 OK` 或 `201 Created`，但响应体中的资源版本必须一致
- 同 key 不同 payload：
  - 返回 `409 IDEMPOTENCY_KEY_REUSED`

### 9.2 显式版本前置条件

- 诊断生成必须带 `inspectionVersion`
- 方案生成必须带 `diagnosisVersion`
- 验收生成必须带 `planVersion`

这样做的目的：

- 避免“详情页打开后后台数据已更新”导致的隐式覆盖
- 让客户端重试具备可预期性
- 为未来异步化留出兼容空间

## 10. 身份、授权、租户

### 10.1 Demo 当前假设

- 默认单租户单项目演示
- 本地 Demo 可配置为关闭鉴权
- 即使关闭鉴权，也应在服务端固定注入 `tenantId = demo`

### 10.2 生产版约束

- 使用 `Bearer token`
- `tenantId` 必须从 token 或服务端 session 推导，不能由客户端自由传入
- `projectId` 只是租户内的数据域过滤条件，不是权限边界替代品

## 11. 版本策略与弃用

- 路径版本：`/api/v1`
- `v1` 内只允许兼容性增强：
  - 增加可选字段
  - 增加新枚举值
  - 增加新只读端点
- 以下属于 breaking change，必须进入 `v2`：
  - 删除字段
  - 修改字段含义或单位
  - 修改必填性
  - 把同步接口直接改为异步而不提供兼容模式

字段弃用策略：

- 先在 OpenAPI 中标记 `deprecated: true`
- 至少保留一个演示周期
- 在 `API_CONTRACT.md` 记录迁移路径

## 12. 前后端字段对齐注意事项

1. API 统一使用 `camelCase`，前端 TypeScript 直接消费；后端 ORM/Pydantic 内部再做映射。
2. `riskLevel` 与 `diseaseLevel` 不是同一概念：
   - `riskLevel` 用于地图/总览风险分层
   - `diseaseLevel` 用于 A/B/C/D 病害等级
3. 地图颜色不入合同。前端应按 `riskLevel` 自行映射 UI 色板，避免把展示逻辑固化为 API 字段。
4. `confidence` 一律使用 `0-1` 小数，不返回百分比字符串。
5. 诊断 polygon 与注浆孔位使用井周局部坐标，不复用地图经纬度组件。
6. 文本性结论如 `noiseConclusion` 可直接用于验收页展示，但不得承诺“彻底消除噪音”等不可验收表述。

## 13. Demo-only Mock 与未来生产 API 差异

| 维度 | Demo-only Mock | 未来生产 API |
| --- | --- | --- |
| 数据来源 | seed + 脱敏虚构坐标 + 占位图 | 实际项目、真实 GIS、检测设备接入 |
| 诊断执行 | 同步、确定性规则模型 | 可能异步，含模型推理与人工复核 |
| 方案生成 | 直接基于当前诊断单例 | 可能支持多版本比选与人工调整 |
| 施工模拟 | 静态步骤与目标参数 | 可能接入实时压力/流量/抬升传感器 |
| 验收报告 | JSON 结构化报告为主 | 可能同时产出 PDF、二维码、电子签章 |
| 历史追踪 | 只暴露当前结果单例 | 需补充分版本历史、审计日志、回滚关系 |
| 鉴权 | 可关闭 | 必须开启，按租户/项目/角色控制 |

兼容建议：

- 当前 `POST` 生成接口保留同步返回资源；未来若异步化，可在 `v1` 增加 `generationStatus = pending` 和 `operationId`，而不是直接改写现有成功语义。

## 14. 本次 OpenAPI 草案覆盖范围

`docs/generated/openapi.draft.yaml` 已覆盖：

- 核心 12 个端点
- 关键请求/响应 schema
- 统一错误模型
- 鉴权与幂等 header
- 分页与过滤参数

未在本稿细化的内容：

- 图片/附件上传接口
- 真正的历史版本列表接口
- PDF 报告下载接口
- 施工过程实时流式接口

## 15. 待确认项

1. `projectId` 是否在 MVP 中对前端可见，还是固定单项目不暴露。
2. 地图是否需要后端聚合点或 cluster 合同；当前草案只定义 `bbox + limit`。
3. 路演脚本的 `narration` 是否由后端托管；若文案频繁调整，也可改为前端静态资源。
4. 验收报告是否需要在 `v1` 就暴露 `pdfUrl` 占位字段；当前草案未加入。
5. 未来是否必须保留诊断/方案/验收历史版本接口；若是，建议在实现前同步补一版 `runs/history` 资源设计。
