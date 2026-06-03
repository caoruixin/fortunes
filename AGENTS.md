# AGENTS.md

## Project
本项目是“井周智修”道路检查井井周病害 AI 诊断与微创修复可视化 Demo。

目标是交付一个可本地运行、可客户路演的全栈 Demo，展示：
1. 检查井井周病害可通过无损检测和 AI 识别被看见；
2. 系统可自动输出风险评分、病害等级、维修工法和施工参数；
3. Demo 可完成地图、单井详情、AI 诊断、维修方案、施工模拟、验收报告的闭环；
4. 每座井形成“一井一档”，支持后续复检和养护决策。

## Required References
所有 Agent 在做设计、开发或评审前必须优先阅读：
- `references/solution.md`
- `references/demo-requirements.md`
- `references/domain-glossary.md`
- `references/acceptance-criteria.md`

若涉及公共标准或验收口径，优先查看：
- `references/public-standards/`

## Product Scope
必须优先实现主流程：

```text
城市道路风险地图
  -> 选择高风险检查井
  -> 单井病害详情
  -> 触发 AI 诊断
  -> 输出病害等级、热力图、推荐工法
  -> 生成维修方案
  -> 展示施工模拟
  -> 生成验收报告
```

MVP 页面范围：
- `/dashboard` 总览与风险指标；
- `/map` 检查井风险地图；
- `/manholes/[id]` 单井详情；
- `/manholes/[id]/diagnosis` AI 诊断；
- `/manholes/[id]/plan` 维修方案；
- `/manholes/[id]/simulation` 施工模拟；
- `/manholes/[id]/acceptance` 验收报告；
- `/demo-script` 路演模式。

## Suggested Stack
默认技术方向：
- Frontend: Next.js, React, TypeScript;
- UI: Tailwind CSS plus shadcn/ui style components;
- Map: Leaflet first; Mapbox only if a token is provided;
- Charts: ECharts or Recharts;
- Backend: FastAPI;
- Database: PostgreSQL plus PostGIS;
- API contract: OpenAPI;
- Local delivery: Docker Compose;
- Tests: Pytest, Playwright, Vitest where useful.

如需调整技术栈，必须先说明调整原因、影响范围和对一键启动的影响。

## Engineering Rules
- 不允许只做静态页面，核心流程必须有 API、数据模型和 Mock AI 逻辑支撑。
- Mock AI 诊断必须是确定性、可解释、工程上可信的规则模型，不使用纯随机结果。
- 前后端字段必须以 OpenAPI 或 shared schema 对齐。
- 数据库必须有 schema、migration 和 seed 数据计划。
- Demo 必须能在无真实雷达模型、无真实 GIS 数据、无真实照片时使用模拟数据运行。
- 不得把未授权的客户资料、真实坐标、真实影像或非公开材料放进仓库。
- 所有非开源资源只放占位目录和清单，等待用户提供。
- 对外话术避免“彻底消除噪音”等不可量化承诺，使用“验收状态下无明显跳动、空响和异常冲击声”。

## Demo Quality Bar
客户演示优先级高于内部后台完整度。界面必须体现：
- 市政道路行业感；
- AI 诊断科技感；
- 工程数据可信感；
- 修复前后对比冲击力；
- 领导和非技术人员一眼能理解。

不要过度炫技。地图、诊断、施工过程和验收报告必须清楚、稳定、可解释。

## Agent Workflow
推荐分四轮执行。

### Phase 1: Design Freeze
不要写业务代码。产出：
- `docs/generated/PRD.md`
- `docs/generated/ARCHITECTURE.md`
- `docs/generated/UI_SPEC.md`
- `references/acceptance-criteria.md` 更新稿

推荐 agents / skills：
- `domain-product-owner` with `manhole-demo-prd`;
- `api-designer` with `manhole-solution-architecture`;
- `ui-designer` with `manhole-ui-ux-demo-designer`.

### Phase 2: Foundation
搭建基础工程、数据库、API 和页面骨架。产出：
- database schema, migrations, seed;
- backend API skeleton and OpenAPI;
- frontend routes and core layout;
- mock data fixtures.

推荐 agents / skills：
- `postgres-pro` with `manhole-database-designer`;
- `backend-developer` or `fastapi-developer` with `manhole-backend-api-engineer`;
- `frontend-developer` or `nextjs-developer` with `manhole-frontend-demo-engineer`.

### Phase 3: Core Demo Loop
实现地图到验收报告的闭环。产出：
- deterministic mock diagnosis;
- heatmap / polygon / grouting point data;
- repair plan generation;
- construction simulation timeline;
- acceptance report generation.

推荐 agents / skills：
- `ai-diagnosis-mock-engineer` with `manhole-diagnosis-mock`;
- `backend-developer` with `manhole-backend-api-engineer`;
- `frontend-developer` with `manhole-frontend-demo-engineer`;
- `ui-designer` with `manhole-ui-ux-demo-designer`.

### Phase 4: Delivery Validation
完成验证、修复和交付说明。产出：
- API tests;
- E2E demo flow test;
- Docker Compose local runner;
- README startup path;
- P0/P1 review fixes.

推荐 agents / skills：
- `qa-expert` with `manhole-qa-validation` and `playwright`;
- `docker-expert` with `manhole-devops-local-runner`;
- `reviewer` and `security-auditor` with `manhole-code-review`, `security-best-practices`, `security-threat-model`.

## Acceptance Criteria
完成交付必须满足：
1. `docker compose up --build` 可启动前端、后端、数据库；
2. 首页或地图页可看到检查井风险分布；
3. 点击高风险井可进入详情；
4. 可触发 AI 诊断；
5. 可生成病害等级、风险评分、热力图或 polygon 数据；
6. 可生成维修方案和施工参数；
7. 可展示微孔注浆、井座锁固、快硬材料恢复施工模拟；
8. 可生成“一井一档”验收报告；
9. API 测试和核心 E2E 测试通过；
10. README 能指导非开发人员启动 Demo。

## Final Response Requirements
Agent 完成任务时必须说明：
- changed files;
- behavior delivered;
- validation performed;
- remaining risks or required user-provided resources.
