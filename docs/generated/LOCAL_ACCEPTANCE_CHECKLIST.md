# 本地验收清单

更新时间：2026-06-02  
适用阶段：MVP 本机联调与客户路演前自验  
依据：`AGENTS.md`、`references/acceptance-criteria.md`、`docs/generated/PRD.md`、`docs/generated/UI_SPEC.md`、`docs/generated/API_CONTRACT.md`、`docs/generated/openapi.draft.yaml`

## 1. 本次 QA 分析范围

- 功能路径：`/dashboard` -> `/map` -> `/manholes/[id]` -> `/manholes/[id]/diagnosis` -> `/manholes/[id]/plan` -> `/manholes/[id]/simulation` -> `/manholes/[id]/acceptance`
- 配套接口：
  - `GET /api/v1/dashboard/summary`
  - `GET /api/v1/map/manholes`
  - `GET /api/v1/manholes/{manholeId}`
  - `POST/GET /api/v1/manholes/{manholeId}/diagnosis`
  - `POST/GET /api/v1/manholes/{manholeId}/plan`
  - `GET /api/v1/manholes/{manholeId}/simulation`
  - `POST/GET /api/v1/manholes/{manholeId}/acceptance`
- 重点风险面：
  - 本地服务起不来，无法进入演示
  - 地图无点位或点位不区分风险，主流程无法开始
  - 详情、诊断、方案、施工、验收任一页面断链
  - Mock AI 结果不稳定，重复演示口径漂移
  - 刷新后核心派生数据丢失，影响演示连续性

## 2. 进入验收前置条件

- 前端和后端可分别本地启动，并能通过浏览器访问。
- 后端暴露 OpenAPI 文档，至少满足 `openapi.draft.yaml` 中的 P0 接口。
- 已加载 seed 数据，至少包含 20 座检查井，覆盖 A/B/C/D 病害。
- 至少 1 座高风险 Demo 井具备完整链路：详情、诊断、方案、施工、验收。
- 若后端尚未完成，前端必须明确切到 mock adapter，并在验收记录中标记为“前端降级演示”。

## 3. 通过标准

- P0 阻断为 0 个。
- 核心链路 8 个节点全部可达且可解释。
- 同一 Demo 井重复触发诊断/方案/验收时，关键结果保持一致。
- 刷新页面后，核心数据不丢失；若当前实现是进程内 mock，不跨重启持久化，需在验收记录中明确说明。

## 4. 风险到验证映射

| 编号 | 风险 | 优先级 | 最小验证路径 | 通过证据 |
| --- | --- | --- | --- | --- |
| R1 | 服务无法本地启动 | P0 | 启动前端、后端；访问 `/dashboard` 和 `/api/v1` | 页面返回 200；接口可响应；OpenAPI 可打开 |
| R2 | Dashboard 不可用，客户无法建立整体认知 | P0 | 打开 `/dashboard` | 页面加载完成；显示 KPI/风险分布或清晰空态 |
| R3 | 地图无点位或无法识别高风险井 | P0 | 打开 `/map`；检查点位与风险图例 | 有 20+ 点位；高风险井可见；列表与地图一致 |
| R4 | 无法从高风险井进入详情 | P0 | 点击一座红色或高风险井 | 打开 `/manholes/[id]`；详情含基础信息、检测指标、雷达预览、历史维修 |
| R5 | AI 诊断断链或结果不完整 | P0 | 触发诊断 | 返回风险评分、病害等级、病害类型、深度范围、置信度、热力图或 polygon |
| R6 | 方案页无法生成可施工数据 | P0 | 从诊断进入方案页 | 返回工法、材料、孔位/注浆点、压力、注浆量、工期、开放交通时间 |
| R7 | 施工模拟不具备讲解价值 | P0 | 打开施工模拟页 | 至少展示精准布孔、低压分级注浆、井座锁固与调平、快硬材料恢复 |
| R8 | 验收报告不闭环 | P0 | 生成验收报告 | 有修复前后对比、材料/记录、复检建议、“一井一档”口径 |
| R9 | 重复演示结果漂移 | P1 | 对同一井重复诊断/生成方案/生成验收 | 关键结果一致，版本或时间戳变化可解释 |
| R10 | 刷新后丢失核心数据 | P1 | 刷新诊断/方案/验收页 | 页面仍能取回同一井核心数据，或明确为非持久 mock |
| R11 | D 级井误推荐微创闭环 | P1 | 抽查 D 级井生成方案 | 返回 CCTV 复核或局部开挖等退出机制 |
| R12 | 页面虽可用但行业表达失真 | P2 | 人工走查 | 风险色、图例、施工步骤、验收话术符合 UI_SPEC/PRD |

## 5. 手工验收步骤

### 5.1 启动与冒烟

1. 启动后端，确认 OpenAPI 文档可打开。
2. 启动前端，访问 `/dashboard`。
3. 确认 `/dashboard`、`/map` 均能首屏加载，无全屏报错。

### 5.2 主流程闭环

1. 在 `/map` 确认地图或列表中可见高风险井。
2. 点击高风险井进入 `/manholes/[id]`。
3. 在详情页确认以下信息存在：
   - 井编号、道路名、管线类型、交通等级
   - 井周照片占位或素材
   - 检测指标：高差、平整度、异响、裂缝、沉陷等
   - 雷达扫描预览
   - 历史维修或投诉
4. 触发 AI 诊断，确认以下信息存在：
   - 风险评分
   - 病害等级
   - 病害类型
   - 深度范围
   - 置信度
   - 热力图或 polygon
5. 进入维修方案页，确认以下信息存在：
   - 推荐工法
   - 材料
   - 孔位或注浆点
   - 注浆压力
   - 注浆量
   - 施工时间
   - 开放交通时间
6. 进入施工模拟页，确认至少 4 个标准步骤完整展示。
7. 生成验收报告，确认以下信息存在：
   - 修复前后指标对比
   - 施工记录或注浆记录
   - 材料批次
   - 验收结论
   - 复检建议

### 5.3 稳定性与刷新

1. 记录选中的 Demo 井 ID。
2. 重复触发诊断两次，确认结果一致。
3. 刷新诊断页，再次确认关键结果仍存在。
4. 生成方案和验收后分别刷新页面，确认核心数据仍存在。
5. 如果数据只在当前进程内保留、不跨服务重启持久化，在验收记录中写明：
   - “当前为 mock 会话态稳定，跨服务重启不保证持久化”
   - 或“当前已持久化到数据库，刷新与重启后均可重取”

## 6. 自动化建议

当前优先级是本机 MVP 跑通，不强制先搭完整 Playwright 基建。建议最小自动化分两层：

- 轻量 HTTP 验证：
  - 用 `tests/e2e/local_demo_smoke.py` 检查前端页面可访问、核心接口可连通、派生资源链条可生成。
- 浏览器 E2E：
  - 当前端结构稳定后，再补一条 Playwright 主流程：`map -> detail -> diagnosis -> plan -> simulation -> acceptance`

## 7. 缺陷分级

- `P0`
  - 服务起不来
  - Dashboard/Map/Detail/Diagnosis/Plan/Simulation/Acceptance 任一节点不可达
  - 地图无高风险井可点击
  - 诊断或方案缺关键字段，无法讲解
- `P1`
  - 结果不稳定
  - 刷新丢数据
  - D 级井策略错误
  - 页面能用但数据映射与合同不一致
- `P2`
  - 视觉表达、文案、图例、对比呈现不够清晰
  - 非关键字段缺失但不阻断演示

## 8. 验收记录模板

| 项目 | 结果 | 证据/备注 |
| --- | --- | --- |
| 前端启动 | 通过 | `http://127.0.0.1:3001/dashboard` 返回 200 HTML |
| 后端启动 | 通过 | `http://127.0.0.1:8000/openapi.json` 返回 OpenAPI 3.1.0 |
| OpenAPI 可访问 | 通过 | FastAPI 自动文档可访问 |
| Dashboard 打开 | 通过 | `tests/e2e/local_demo_smoke.py` 验证 `/dashboard` 200 |
| Map 有点位 | 通过 | API 返回 20 座检查井，脚本选择 `mh-0007` |
| 高风险井进入详情 | 通过 | `/manholes/mh-0007` 返回 200 |
| AI 诊断可触发 | 通过 | `POST /diagnosis` 返回 C 级、风险评分 80、热力/缺陷数据 |
| 维修方案可生成 | 通过 | `POST /plan` 返回工法、材料、注浆量、施工时间和开放交通时间 |
| 施工模拟可查看 | 通过 | `GET /simulation` 返回 4 个施工步骤 |
| 验收报告可生成 | 通过 | `POST /acceptance` 返回验收报告和修复前后指标 |
| 刷新后核心数据保留 | 通过 | 当前进程内状态下 GET 可回读验收报告；服务重启后回到 seed 初始状态 |
| 诊断/方案结果稳定 | 通过 | 重复 POST 诊断和方案关键字段一致 |

## 9. 当前仓库状态备注

- 截至 2026-06-03，客户演示打磨阶段已落地，`apps/web/` 与 `services/api/` 均可运行。
- 已实测命令：`python -m pytest -p no:capture tests/api -q`，结果 `14 passed`。
- 已实测命令：`npm run lint`，通过。
- 已实测命令：`npm run build`，通过。
- 已实测命令：`scripts/check-demo.sh`，HTTP smoke 与 Playwright 浏览器主流程均通过。
- Playwright 托管浏览器缺失时，`tests/e2e/playwright_demo_flow.py` 会使用本机 Chrome fallback。
