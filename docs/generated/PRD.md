# 井周智修 Design Freeze PRD

版本：v0.1  
阶段：Phase 1 Design Freeze  
范围：客户路演用全栈 Demo 产品定义，不包含业务代码实现  
依据：`AGENTS.md`、`references/solution.md`、`references/demo-requirements.md`、`references/domain-glossary.md`、`references/acceptance-criteria.md`、`references/public-standards/`

## 1. 产品定位

“井周智修”是道路检查井井周病害 AI 诊断与微创修复可视化 Demo。Demo 用一条可本地运行、可客户路演的闭环流程，展示从城市道路风险地图、单井病害详情、AI 诊断、维修方案、施工模拟到“一井一档”验收报告的全过程。

Demo 的核心价值不是证明真实 AI 模型已经完成训练，而是让客户理解未来产品的工作方式：原来不可见的井周空洞、基层松散、局部脱空、水损和井座松动风险，可以通过无损检测和 AI 规则诊断变成可视化、可解释、可决策、可验收的数据链路。

## 2. 产品目标

1. 面向客户路演，5-8 分钟内讲清楚“病害能看见、方案能判断、效果能验证”的价值。
2. 固化 MVP 主流程：城市道路风险地图 -> 选择高风险检查井 -> 单井病害详情 -> 触发 AI 诊断 -> 输出病害等级、热力图、推荐工法 -> 生成维修方案 -> 展示施工模拟 -> 生成验收报告。
3. 每座 Demo 井形成“一井一档”，覆盖检测、诊断、方案、施工、验收和复检建议。
4. 通过 API、数据模型和确定性 Mock AI 支撑演示，避免只做静态页面。
5. 明确 Demo-only 行为和未来生产产品差异，避免把模拟数据误表述为已完成真实工程验证。
6. 建立量化验收口径，对外避免不可量化的绝对化降噪承诺，统一使用“验收状态下无明显跳动、空响和异常冲击声”。

## 3. 目标用户

| 用户 | 关注点 | Demo 需要回答的问题 |
| --- | --- | --- |
| 市政业主/主管领导 | 城市道路安全、投诉治理、占道时间、结果可追溯 | 这套方案是否能减少反复维修、缩短占道、形成闭环管理 |
| 养护管理负责人 | 资产风险排序、维修策略、年度养护计划 | 哪些井优先修，为什么这样修，后续如何复检 |
| 现场工程师/施工负责人 | 病害类型、孔位、注浆参数、施工质控 | 每座井怎么布孔、怎么控压、何时开放交通 |
| 质检/验收人员 | 平整度、声振、材料、复检、报告 | 修复后如何量化验收，报告能否追溯 |
| 商务/路演操作员 | 稳定演示、固定叙事、易讲解 | 如何按固定脚本从地图一路讲到验收报告 |
| 技术评审/集成团队 | API、数据模型、Mock 边界、测试 | 这不是静态页面，是否具备可实现的系统边界 |

## 4. 关键产品决策

| 编号 | 决策 | 理由 |
| --- | --- | --- |
| D1 | 主演示井默认选 C 级病害：基层松散 + 局部脱空 + 井座松动风险 | C 级最适合展示微孔注浆、井座锁固和快硬材料恢复，能体现微创修复价值 |
| D2 | D 级病害纳入 seed 和诊断结果，但作为“退出微创工法/需 CCTV 复核或局部开挖”的边界案例 | 防止 Demo 暗示深层空洞、管道渗漏或结构性破坏都能靠注浆解决 |
| D3 | Demo 使用确定性 Mock AI 规则，不使用随机结果 | 保障路演稳定性、测试可复现、诊断解释可信 |
| D4 | 风险地图坐标默认使用虚构或脱敏坐标 | 避免未授权客户坐标和真实敏感 GIS 数据进入仓库 |
| D5 | API/OpenAPI 是主数据契约，前端 mock adapter 只能作为无后端降级演示能力 | 满足“核心流程必须有 API、数据模型和 Mock AI 逻辑支撑”的工程要求 |
| D6 | MVP 页面按 AGENTS.md 的 8 个路由冻结，`references/demo-requirements.md` 中 5 页 MVP 视为叙事页集合 | 保留完整路演路径，也支持把诊断、方案、施工、验收做成独立可测试页面 |
| D7 | 验收话术只采用可测量表达：平整度、井盖高差、声振状态、开放交通时间、注浆记录、复检建议 | 降低验收争议，避免不可量化承诺 |
| D8 | 首版不接真实雷达模型、真实照片、真实施工设备和真实 GIS | Design Freeze 目标是本地可演示产品，不把外部资产依赖作为启动前置条件 |

## 5. 核心主流程

### 5.1 客户可见流程

```text
/map 城市道路风险地图
  -> 点击红色高风险检查井
  -> /manholes/[id] 单井病害详情
  -> 点击“开始 AI 诊断”
  -> /manholes/[id]/diagnosis AI 诊断结果
  -> 点击“生成维修方案”
  -> /manholes/[id]/plan 维修方案与施工参数
  -> 点击“查看施工模拟”
  -> /manholes/[id]/simulation 微创施工模拟
  -> 点击“生成验收报告”
  -> /manholes/[id]/acceptance 一井一档验收报告
```

### 5.2 页面内叙事重点

1. 地图页：这不是单点维修工具，而是道路检查井风险管理平台。
2. 单井详情页：表面沉陷、异响、裂缝和雷达异常共同指向井周结构风险。
3. AI 诊断页：地下病害被量化成等级、热力图、异常区域、深度范围和置信度。
4. 维修方案页：系统不建议只做表面修补，而是按病害等级推荐工法、材料和参数。
5. 施工模拟页：展示精准布孔、低压分级注浆、井座锁固与调平、快硬材料恢复。
6. 验收报告页：用修复前后数据证明“验收状态下无明显跳动、空响和异常冲击声”，并形成“一井一档”。

## 6. MVP 范围

### 6.1 P0 必须交付

1. `/dashboard` 总览与风险指标。
2. `/map` 检查井风险地图，展示至少 20 座检查井，按风险颜色分级。
3. `/manholes/[id]` 单井详情，展示基本信息、照片占位、检测指标、雷达扫描预览和历史维修。
4. `/manholes/[id]/diagnosis` AI 诊断，展示风险评分、病害等级、病害类型、深度范围、置信度、热力图或 polygon。
5. `/manholes/[id]/plan` 维修方案，展示推荐工法、推荐理由、材料、孔位、注浆量、施工时间、开放交通时间。
6. `/manholes/[id]/simulation` 施工模拟，至少包含精准布孔、低压分级注浆、井座锁固与调平、快硬材料恢复四步。
7. `/manholes/[id]/acceptance` 一井一档验收报告，展示修复前后指标、材料批次、注浆记录、复检建议。
8. `/demo-script` 路演模式，提供固定演示路线、讲解提示和下一步导航。
9. FastAPI 后端、OpenAPI 契约、PostgreSQL/PostGIS schema、migration、seed 数据计划。
10. 确定性 Mock AI 诊断规则和测试用例，覆盖 A/B/C/D 四类病害。

### 6.2 P1 应交付

1. 风险筛选：按风险等级、病害等级、道路等级、管线类型筛选。
2. 诊断解释：展示风险评分构成，例如结构异常、沉陷程度、交通荷载、历史维修、投诉、管线风险。
3. 修复前后对比视图：突出高差、平整度、声振、沉陷、开放交通时间、建筑垃圾减少。
4. 一键复制/导出演示报告摘要，供商务路演后发给客户。
5. Mock 数据重置脚本，确保每次演示回到稳定状态。

### 6.3 P2 可延后

1. 真实雷达数据上传、解析和标注。
2. 真实现场照片管理、图片标注和质量审核。
3. 真实施工设备遥测接入，包括压力、流量、位移和温度实时流。
4. 多项目、多片区、多施工队管理。
5. 年度养护计划、复发率统计和成本测算。
6. 移动端现场采集 App。
7. 物理模型和 1-2 分钟动画视频制作。软件 Demo 需预留素材入口，但不把实体模型作为本地软件交付前置条件。

## 7. 非 MVP 范围

1. 不训练或声称已经训练完成真实 AI 识别模型。
2. 不接入真实客户坐标、真实影像、非公开检测数据或未授权管线资料。
3. 不提供正式工程验收法律文件，只生成 Demo 版“一井一档”报告。
4. 不提供真实材料配方、设备控制策略或施工安全审批流程。
5. 不承诺所有井周病害都适合微创注浆，D 级病害必须保留复核和退出机制。
6. 不做不可量化的绝对化降噪承诺，仅表达为“验收状态下无明显跳动、空响和异常冲击声”。

## 8. 页面清单

| 路由 | 页面 | 主要用户 | MVP 内容 | 主操作 | API/数据依赖 |
| --- | --- | --- | --- | --- | --- |
| `/dashboard` | 总览与风险指标 | 业主、养护负责人 | 检查井总数、风险分布、A/B/C/D 病害分布、待处置数量、2 小时开放交通示例指标 | 进入地图 | `GET /api/v1/dashboard/summary` |
| `/map` | 城市道路风险地图 | 业主、路演操作员 | 20+ 点位、风险颜色、道路/管线筛选、选中井信息卡 | 点击高风险井 | `GET /api/v1/map/manholes` |
| `/manholes/[id]` | 单井病害详情 | 工程师、养护负责人 | 基本信息、照片占位、雷达预览、平整度、井盖高差、噪音峰值、裂缝、投诉和历史维修 | 开始 AI 诊断 | `GET /api/v1/manholes/{manholeId}` |
| `/manholes/[id]/diagnosis` | AI 诊断 | 技术评审、业主 | 动态分析过程、风险评分、等级、病害类型、热力图/polygon、深度、置信度、解释因子 | 生成维修方案 | `POST /api/v1/manholes/{manholeId}/diagnosis` |
| `/manholes/[id]/plan` | 维修方案 | 现场工程师、施工负责人 | 推荐工法、材料、孔位、孔深、注浆压力、注浆量、施工时间、开放交通时间、风险提示 | 查看施工模拟 | `POST /api/v1/manholes/{manholeId}/plan` |
| `/manholes/[id]/simulation` | 施工模拟 | 业主、施工负责人 | 精准布孔、低压分级注浆、井座锁固与调平、快硬材料恢复；压力/注浆量/抬升监测 | 生成验收报告 | `GET /api/v1/manholes/{manholeId}/simulation` |
| `/manholes/[id]/acceptance` | 验收报告 | 质检、业主 | 基本信息、诊断结果、孔位图、注浆记录、材料批次、修复前后指标、复检建议、二维码占位 | 返回地图/复制摘要 | `POST /api/v1/manholes/{manholeId}/acceptance` |
| `/demo-script` | 路演模式 | 商务、售前 | 固定讲解脚本、推荐 Demo 井、每页讲解重点、下一步按钮 | 启动路演 | `GET /api/v1/demo-script` |

## 9. 用户故事与优先级

优先级定义：P0 为客户路演闭环必需；P1 为增强可信度和演示效率；P2 为未来真实产品或增强项。

| 编号 | 优先级 | 用户故事 | 验收口径 |
| --- | --- | --- | --- |
| US-01 | P0 | 作为路演操作员，我要从地图选择一座红色高风险井，以便自然进入主流程 | 地图展示至少 20 座井，红/橙/黄/绿四类风险可见，点击红色井进入详情页 |
| US-02 | P0 | 作为养护负责人，我要查看单井基本信息、检测指标和历史维修，以便判断问题不是孤立表面破损 | 详情页包含井编号、道路、管线、交通等级、历史维修次数、投诉次数、井盖高差、平整度、噪音峰值、裂缝长度 |
| US-03 | P0 | 作为业主，我要看到 AI 把地下病害可视化，以便理解无损检测价值 | 诊断页包含热力图或 polygon，至少 3 个异常区域，每个区域有病害类型、深度范围和置信度 |
| US-04 | P0 | 作为技术评审，我要看到风险评分和病害等级的解释，以便判断结果不是黑箱 | 诊断结果包含 0-100 风险评分、A/B/C/D 等级、评分因子和推荐理由 |
| US-05 | P0 | 作为施工负责人，我要获得工法和施工参数，以便把诊断转化为施工方案 | 维修方案包含工法、材料、孔位数量、孔深、注浆压力范围、注浆量范围、施工时间、开放交通时间 |
| US-06 | P0 | 作为客户领导，我要看到施工过程动画，以便理解微创修复不是大开挖 | 施工模拟至少展示精准布孔、低压分级注浆、井座锁固与调平、快硬材料恢复四个步骤 |
| US-07 | P0 | 作为质检人员，我要生成一井一档报告，以便验收结果可追溯 | 报告包含修复前后指标、诊断摘要、施工参数、材料批次、复检建议和二维码占位 |
| US-08 | P0 | 作为 QA，我要 Mock AI 结果可复现，以便自动化测试稳定 | 同一 seed 井多次触发诊断，等级、评分、polygon、方案参数完全一致 |
| US-09 | P1 | 作为养护负责人，我要筛选高风险和 D 级井，以便识别必须复核或退出微创工法的场景 | 筛选后列表和地图点位一致，D 级井方案显示 CCTV 复核/局部开挖建议 |
| US-10 | P1 | 作为商务人员，我要使用路演模式，以便按固定脚本稳定演示 | `/demo-script` 能按步骤跳转，包含每一步讲解要点和推荐示例井 |
| US-11 | P1 | 作为业主，我要看到修复前后对比，以便判断价值是否量化 | 对比展示平整度、井盖高差、噪音状态、开放交通时间、建筑垃圾减少估算 |
| US-12 | P2 | 作为现场工程师，我要上传真实雷达和照片，以便从 Demo 进入试点系统 | P2 不纳入首版交付，仅保留数据模型扩展点 |

## 10. API 需求

### 10.1 API 原则

1. 后端使用 FastAPI 并暴露 OpenAPI 文档。
2. 前后端字段以 OpenAPI 或 shared schema 对齐。
3. 所有 Mock AI 输出必须可复现，同一输入返回同一结果。
4. Demo 可在无真实雷达模型、无真实 GIS、无真实照片时用 seed 数据完整运行。
5. D 级病害的 plan API 不能推荐单纯微创注浆闭环，必须返回复核或退出机制。

### 10.2 Endpoint 清单

以 `docs/generated/API_CONTRACT.md` 和 `docs/generated/openapi.draft.yaml` 为 P0 API 命名源。

| 方法 | Endpoint | 用途 | P0 |
| --- | --- | --- | --- |
| GET | `/api/v1/dashboard/summary` | 总览风险指标 | 是 |
| GET | `/api/v1/map/manholes` | 地图点位视图，支持 bbox、riskLevel、diseaseLevel、pipelineType 筛选 | 是 |
| GET | `/api/v1/manholes` | 单井列表与检索，支持游标分页 | 是 |
| GET | `/api/v1/manholes/{manholeId}` | 单井详情和最近检测指标，可按需 include 诊断/方案/验收摘要 | 是 |
| POST | `/api/v1/manholes/{manholeId}/diagnosis` | 触发或复用确定性 Mock AI 诊断 | 是 |
| GET | `/api/v1/manholes/{manholeId}/diagnosis` | 获取当前诊断结果 | 是 |
| POST | `/api/v1/manholes/{manholeId}/plan` | 基于诊断生成或复用维修方案 | 是 |
| GET | `/api/v1/manholes/{manholeId}/plan` | 获取当前维修方案 | 是 |
| GET | `/api/v1/manholes/{manholeId}/simulation` | 获取施工模拟步骤和遥测曲线 | 是 |
| POST | `/api/v1/manholes/{manholeId}/acceptance` | 基于方案生成或复用验收报告 | 是 |
| GET | `/api/v1/manholes/{manholeId}/acceptance` | 获取当前验收报告 | 是 |
| GET | `/api/v1/demo-script` | 获取路演流程、推荐井和讲解提示 | 是 |

### 10.3 关键响应字段

#### Manhole

- `id`
- `code`
- `road_name`
- `district`
- `pipe_type`: rainwater, sewage, power, telecom, other
- `manhole_type`
- `cover_type`
- `traffic_level`
- `owner`
- `coordinates`: fictional or anonymized point
- `risk_score`: 0-100
- `risk_level`: low, medium, high, critical
- `disease_grade`: A, B, C, D
- `last_inspected_at`
- `last_repaired_at`
- `complaint_count`
- `maintenance_count`

#### InspectionSnapshot

- `height_delta_mm`
- `flatness_mm`
- `noise_peak_db`
- `vibration_index`
- `settlement_mm`
- `crack_length_m`
- `surface_damage_level`
- `radar_preview_asset`
- `photo_assets`
- `gpr_summary`

#### Diagnosis

- `diagnosis_id`
- `manhole_id`
- `risk_score`
- `disease_grade`
- `primary_diseases`: void, loose_base, debonding, water_damage, frame_looseness, shaft_defect
- `findings[]`
- `confidence`
- `heatmap_cells[]` or `polygons[]`
- `depth_min_cm`
- `depth_max_cm`
- `estimated_void_volume_l`
- `rule_factors[]`
- `recommended_strategy`
- `requires_review`: true for D grade or low confidence

#### RepairPlan

- `plan_id`
- `recommended_methods[]`: cover_locking, micro_grouting, ring_cut_repair, fast_hard_material, cctv_review, local_excavation
- `materials[]`
- `grouting_points[]`: point_no, position_angle_deg, distance_from_cover_cm, depth_cm, target_zone_id
- `pressure_range_mpa`
- `estimated_volume_l`
- `surface_repair_area_m2`
- `estimated_duration_min`
- `open_traffic_after_h`
- `quality_controls[]`
- `risk_warnings[]`

#### ConstructionSimulation

- `steps[]`: drilling, staged_grouting, frame_locking_leveling, fast_hard_recovery
- `timeline[]`
- `telemetry[]`: pressure_mpa, flow_l_min, accumulated_volume_l, uplift_mm, alert_status
- `before_after_visual_state`

#### AcceptanceReport

- `report_id`
- `manhole_id`
- `diagnosis_summary`
- `repair_plan_summary`
- `construction_records`
- `material_batches[]`
- `before_metrics`
- `after_metrics`
- `acceptance_status`
- `acceptance_statement`
- `recheck_recommendation`
- `recurrence_risk_3m`
- `recurrence_risk_6m`
- `recurrence_risk_12m`
- `qr_code_placeholder`

## 11. 数据需求

### 11.1 Seed 数据

1. 至少 20 座检查井。
2. 覆盖 A/B/C/D 四类病害。
3. 至少 1 座主路演 C 级高风险井，具备完整链路：详情、检测、诊断、方案、施工模拟、验收报告。
4. 至少 1 座 D 级边界井，诊断后显示深层空洞、管道渗漏或结构性破坏风险，方案推荐 CCTV 复核和局部开挖/管网修复。
5. 坐标使用虚构或脱敏坐标，不使用真实客户坐标。
6. 照片、雷达图、热力图可用占位素材或程序生成示意，不放入未授权真实影像。

### 11.2 主路演井建议数据

| 字段 | 示例 |
| --- | --- |
| 井编号 | MH-C-001 |
| 道路 | 城市主干路公交车道示例段 |
| 风险评分 | 86/100 |
| 病害等级 | C 级 |
| 井盖与路面高差 | 修复前 -8 mm，修复后控制在 2 mm 以内 |
| 三米直尺平整度 | 修复前 7.5 mm，修复后 2.4 mm |
| 声振状态 | 修复前噪音峰值 82 dB，验收状态下无明显跳动、空响和异常冲击声 |
| 主要病害 | 东南侧局部脱空，西侧基层松散，井座承压面松动风险 |
| 注浆孔数量 | 8 个 |
| 注浆深度 | 25-45 cm |
| 预计注浆量 | 35-50 L |
| 注浆压力 | 示例过程 0.20-0.35 MPa |
| 路面抬升监测 | 示例过程最大 0.6 mm |
| 施工时间 | 90-120 分钟 |
| 开放交通时间 | 修复后 2 小时 |

## 12. Mock AI 规则边界

### 12.1 Demo-only Mock 行为

1. 风险评分由固定规则计算，例如结构异常程度、沉陷程度、交通荷载、历史维修次数、异响投诉、管线风险加权。
2. 病害等级由阈值和关键风险条件决定：
   - A：轻微表层病害，通常做胶圈、限位、调平。
   - B：浅层脱空或井座松动，通常做井座锁固和环形快修。
   - C：基层松散、局部空洞、沉陷明显，通常做微孔注浆和局部环切修复。
   - D：深层空洞、管道渗漏或结构性破坏，应 CCTV 复核并考虑局部开挖或管网修复。
3. 热力图、polygon、孔位和施工参数由 seed 检测指标派生，不能随机生成。
4. 置信度用于 Demo 解释，不代表已通过真实盲测验证。
5. 复发风险为规则预测，用于展示未来能力，不作为真实工程承诺。

### 12.2 未来生产差异

| 能力 | Demo MVP | 未来真实产品 |
| --- | --- | --- |
| 病害识别 | 确定性 Mock 规则和示意热力图 | 接入雷达、照片、声振、历史数据，基于标注库训练和验证模型 |
| 准确率 | 不宣称真实准确率，只展示目标和验证路径 | 需不少于 300 座井数据，20%-30% 复核样本，盲测病害识别准确率、定位误差、漏报率 |
| GIS | 虚构或脱敏坐标 | 授权 GIS 和资产台账，满足客户数据安全要求 |
| 施工参数 | 基于规则估算 | 由工程师审核，结合现场温度、湿度、材料批次、设备能力修正 |
| 施工模拟 | 预生成步骤和遥测曲线 | 真实设备压力、流量、注浆量、位移、报警数据接入 |
| 验收报告 | Mock 指标和占位素材 | 真实平整度、声振、复检雷达、材料批次和现场签认 |

## 13. 路演脚本

建议路演时长 5-8 分钟，固定使用主路演 C 级井。

| 步骤 | 页面 | 讲解话术 | 屏幕结果 |
| --- | --- | --- | --- |
| 1 | `/dashboard` 或 `/map` | “这不是单个井盖维修工具，而是城市道路检查井风险管理和诊修平台。” | 看到风险分布、红橙黄绿点位和高风险数量 |
| 2 | `/map` -> `/manholes/[id]` | “我们选择这座红色高风险井，它位于主干路公交车道，近期有多次异响投诉，历史维修过多次。” | 进入单井档案，展示井编号、道路、投诉、维修、检测指标 |
| 3 | `/manholes/[id]/diagnosis` | “系统综合雷达、照片、平整度和声振数据，识别出东南侧局部脱空、西侧基层松散和井座松动风险。” | 生成 C 级诊断、86 分风险评分、热力图、异常区域和置信度 |
| 4 | `/manholes/[id]/plan` | “它不适合只做表面修补。系统推荐微孔注浆、井座锁固和快硬材料恢复。” | 展示 8 个孔位、25-45 cm 孔深、35-50 L 注浆量、90-120 分钟施工 |
| 5 | `/manholes/[id]/simulation` | “施工过程低压分级注浆，实时监控压力、注浆量和路面抬升，避免串浆和顶升。” | 四步施工动画和遥测数据，最大抬升示例 0.6 mm，异常报警为无 |
| 6 | `/manholes/[id]/acceptance` | “修复完成后，平整度从 7.5 mm 改善到 2.4 mm，高差控制在 2 mm 以内，验收状态下无明显跳动、空响和异常冲击声，并生成一井一档。” | 展示验收报告、修复前后对比、开放交通时间 2 小时、复检建议 |
| 7 | `/map` | “处理后的井点回到可控状态，后续按复检计划纳入年度养护决策。” | 地图点位状态更新或显示已验收标记 |

## 14. 验收标准

### 14.1 产品演示验收

| 编号 | 标准 | 量化口径 |
| --- | --- | --- |
| AC-P01 | 本地可启动 | `docker compose up --build` 可启动前端、后端、数据库 |
| AC-P02 | 地图可展示风险 | `/map` 至少展示 20 座井，红/橙/黄/绿风险颜色清晰可辨 |
| AC-P03 | 高风险井可进入详情 | 点击红色井后进入 `/manholes/[id]`，URL 和页面井编号一致 |
| AC-P04 | 单井详情完整 | 同一页面展示基本信息、照片占位、检测指标、雷达预览和历史维修 |
| AC-P05 | AI 诊断可触发 | 点击开始诊断后生成结果，包含风险评分、A/B/C/D 等级、病害类型、深度、置信度、热力图或 polygon |
| AC-P06 | 诊断可解释 | 主路演井至少展示 3 个异常区域和 5 个评分因子 |
| AC-P07 | 维修方案可生成 | 方案包含工法、材料、孔位数量、孔深、注浆量、施工时间、开放交通时间 |
| AC-P08 | D 级边界可识别 | D 级井不得生成“直接微创修复完成”的闭环，必须显示复核/退出建议 |
| AC-P09 | 施工模拟完整 | 至少展示精准布孔、低压分级注浆、井座锁固与调平、快硬材料恢复四步 |
| AC-P10 | 验收报告完整 | 报告包含基本信息、诊断结果、孔位图、注浆过程、材料批次、开放交通时间、平整度、声振状态、复检建议 |
| AC-P11 | 路演模式可用 | `/demo-script` 能按固定顺序跳转 6 个主步骤，每步有讲解提示 |
| AC-P12 | Demo 无真实敏感数据 | seed 坐标、照片、雷达图均为虚构、脱敏或占位素材 |

### 14.2 工程验收

| 编号 | 标准 | 量化口径 |
| --- | --- | --- |
| AC-E01 | OpenAPI 可访问 | 后端暴露 OpenAPI 文档，核心 endpoint 均有 request/response schema |
| AC-E02 | 数据库可初始化 | 有 schema、migration、seed 计划，seed 至少 20 座井并覆盖 A/B/C/D |
| AC-E03 | Mock AI 可复现 | 同一 manhole id 重复诊断 3 次，等级、风险评分、polygon、方案参数一致 |
| AC-E04 | API 测试覆盖主流程 | 测试覆盖列表、详情、诊断、维修方案、施工模拟、验收报告 |
| AC-E05 | E2E 覆盖主流程 | Playwright 覆盖地图 -> 高风险井 -> 详情 -> 诊断 -> 方案 -> 模拟 -> 验收报告 |
| AC-E06 | 无后端降级演示 | 前端 mock adapter 可演示主流程，但正式验收以 API 联调通过为准 |
| AC-E07 | README 可指导启动 | 非开发人员按 README 能完成启动、访问入口和重置 Demo 数据 |

### 14.3 主路演井效果口径

| 指标 | 修复前示例 | 验收状态示例 | 备注 |
| --- | --- | --- | --- |
| 三米直尺平整度 | 7.5 mm | 2.4 mm，且目标控制在 3 mm 以内 | 用于 Demo 可视化对比 |
| 井盖与路面高差 | -8 mm | 控制在 2 mm 以内 | 以 Demo seed 为准 |
| 声振状态 | 噪音峰值 82 dB，车辆经过有明显跳盖声 | 验收状态下无明显跳动、空响和异常冲击声 | 不使用绝对化降噪承诺 |
| 开放交通时间 | 传统维修示例 6-8 小时 | 修复后 2 小时 | Demo 表达为预计值或示例值 |
| 建筑垃圾减少 | 大开挖维修 | 约 50%-60% 减少 | 必须标注为 Demo 估算 |
| 注浆过程 | 无数字化记录 | 压力、累计注浆量、路面抬升和异常报警可追踪 | 用于展示施工质控 |

## 15. Acceptance Criteria 更新建议

当前 `references/acceptance-criteria.md` 已覆盖主流程、工程、数据、测试和 Demo 质量。建议后续在独立更新稿中补充以下量化项：

1. 地图 seed 数量明确为至少 20 座，并覆盖红/橙/黄/绿四类风险。
2. 主路演 C 级井需至少包含 3 个异常区域、5 个评分因子、8 个注浆孔位和完整验收报告。
3. D 级井必须显示 CCTV 复核或局部开挖/管网修复建议，不能直接推荐微创闭环。
4. Mock AI 可复现验收：同一输入重复 3 次，评分、等级、polygon 和维修参数完全一致。
5. 验收报告必须使用“验收状态下无明显跳动、空响和异常冲击声”，禁止不可量化的绝对化降噪话术。

本次任务只创建 `docs/generated/PRD.md`，未直接修改 `references/acceptance-criteria.md`。

## 16. 假设与需用户提供的资源

### 16.1 当前假设

1. 首版本地 Demo 使用模拟城市片区、模拟检查井坐标和模拟检测数据。
2. 默认技术栈不调整：Next.js/React/TypeScript、Tailwind/shadcn 风格、Leaflet、FastAPI、PostgreSQL/PostGIS、Docker Compose。
3. Mapbox 只有在用户提供 token 时才启用，否则使用 Leaflet 和开放或本地 mock 底图。
4. Demo 报告为客户演示文档，不作为真实工程签章验收文件。
5. 公共标准口径以项目 references 中已有 PDF 为参考；真实项目需要按目标城市、道路等级、井盖类型和客户验收规范确认。

### 16.2 需要用户提供或确认

1. 品牌素材：Logo、产品中文名是否固定为“井周智修”、企业色、演示封面图。
2. 客户公开素材：可公开使用的道路照片、井周照片、雷达示意图、施工照片或视频。
3. 目标城市或行业标准：正式路演是否面向某个城市、园区、机场港区或企业内部道路。
4. 真实坐标策略：是否只使用虚构坐标，还是提供已脱敏且授权的 GIS 点位。
5. 典型病害案例：是否有真实 C 级、D 级案例可转化为脱敏 Demo seed。
6. 材料和设备参数：快硬材料、注浆料、注浆泵、压力范围、开放交通曲线是否有企业内部推荐值。
7. 报告模板：客户是否已有验收报告格式、二维码规则、材料批次字段和签认字段。
8. 商务指标：建筑垃圾减少、成本节约、封路时间减少等估算值是否需要按客户真实基线调整。

## 17. 冲突点与处理

| 冲突/风险 | 处理决策 | 待确认 |
| --- | --- | --- |
| `references/demo-requirements.md` 提到 MVP 可先做 5 个页面，AGENTS.md 要求 8 个路由 | PRD 冻结为 8 个路由；5 个页面视为对外叙事集合 | 无 |
| PRD 初稿使用 `/repair-plan`、`/acceptance-report`、`/latest`，API 草案使用 `/plan`、`/acceptance` 当前单例 | 已按 OpenAPI 草案同步 PRD Endpoint 表，OpenAPI 作为 P0 合同源 | 后续实现不要再引入旧路径别名，除非明确需要兼容 |
| 前端无后端 mock adapter 与“不允许只做静态页面”可能冲突 | API 和数据模型为正式验收口径，mock adapter 仅用于降级演示 | 后续架构文档需定义切换方式 |
| C 级适合微创，D 级不适合直接微创闭环 | D 级作为退出机制案例纳入 seed | 需要真实业务方确认 D 级处置话术 |
| 2 小时开放交通是强卖点，但受材料、温度、湿度影响 | Demo 表达为“预计/示例，修复后 2 小时”，生产需接材料强度曲线 | 需用户提供材料性能数据 |
| 公共标准来自不同地区 | Demo 只采用通用工程口径和项目 reference 数值，正式投标需匹配目标地标准 | 需用户确认目标客户所在地 |
