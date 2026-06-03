# 井周智修 Demo MVP

本仓库用于开发“道路检查井井周病害 AI 诊断与微创修复可视化 Demo”。

当前已完成本机 MVP 基础实现，包含 FastAPI 后端、Next.js 前端、稳定 seed 数据、确定性 Mock AI 诊断、维修方案、施工模拟和“一井一档”验收报告主流程。

## 最快启动方式

本阶段不需要 Docker。推荐使用两个终端启动本地演示，前端固定使用 `3001` 端口，避免和常见开发服务 `3000` 冲突。

首次运行先安装依赖：

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e '.[dev]'
npm install
```

终端 1 启动后端：

```bash
scripts/start-backend.sh
```

终端 2 启动前端：

```bash
scripts/start-frontend.sh
```

终端 3 检查演示链路：

```bash
scripts/check-demo.sh
```

访问：

- Web Demo: `http://127.0.0.1:3001/dashboard`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

固定客户演示路线：

```text
/dashboard
  -> /map
  -> 选择 JW-A-0007 / mh-0007
  -> /manholes/mh-0007
  -> /manholes/mh-0007/diagnosis?autorun=1
  -> /manholes/mh-0007/plan
  -> /manholes/mh-0007/simulation
  -> /manholes/mh-0007/acceptance
  -> /demo-script
```

如果前端提示“请先启动后端服务”，先确认 `scripts/start-backend.sh` 正在运行，并且 `http://127.0.0.1:8000/openapi.json` 可访问。

## Local MVP

后端启动：

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e '.[dev]'
python -m uvicorn services.api.app.main:app --reload
```

前端启动（客户演示推荐，稳定模式）：

```bash
npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 NEXT_PUBLIC_USE_MOCK=false npm run build
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 NEXT_PUBLIC_USE_MOCK=false npm run start --workspace @fortunes/web -- -H 127.0.0.1 -p 3001
```

开发调试可用 `npm run dev`。不要在 `npm run dev` 正在运行时执行 `npm run build`，否则 Next.js 的 `.next` 热更新产物可能被改写，导致 dev 页面出现 overlay。

访问：

- Web Demo: `http://127.0.0.1:3001/dashboard`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

核心演示路径：

```text
/dashboard
  -> /map
  -> /manholes/mh-0007
  -> /manholes/mh-0007/diagnosis?autorun=1
  -> /manholes/mh-0007/plan
  -> /manholes/mh-0007/simulation
  -> /manholes/mh-0007/acceptance
```

测试：

```bash
. .venv/bin/activate
python -m pytest -p no:capture tests/api -q
npm run lint
npm run build
WEB_BASE_URL=http://127.0.0.1:3001 API_BASE_URL=http://127.0.0.1:8000 python tests/e2e/local_demo_smoke.py
WEB_BASE_URL=http://127.0.0.1:3001 python tests/e2e/playwright_demo_flow.py
```

说明：当前派生数据使用进程内 seed + 内存状态，页面刷新可回读；服务重启后会回到 seed 初始状态。后续可按 `docs/generated/IMPLEMENTATION_NOTES.md` 切换 SQLite 或 PostgreSQL/PostGIS。

## Current Structure

```text
AGENTS.md                         项目级 Codex 工作规则
docs/                             原始方案文档
docs/generated/                   后续由 agent 输出的 PRD/架构/UI/测试文档
references/                       固定业务上下文、验收标准、资源清单
.codex/agents/                    项目级 custom agents
.codex/skills/                    项目级业务 skills
apps/web/                         Next.js 前端 Demo
services/api/                     FastAPI 本地后端
packages/domain/                  预留共享领域模型
packages/ui/                      预留共享 UI 组件
packages/shared/                  预留 shared schema/client
infra/docker/                     暂缓 Docker 配置
infra/db/                         暂缓正式 migration/seed
tests/api/                        API 测试
tests/e2e/                        本地 HTTP 冒烟脚本
assets/demo/                      Demo 素材占位
```

## Installed Open Skills

已安装到 `~/.codex/skills`：

- `create-plan` (from `ComposioHQ/awesome-codex-skills`; copied from local shallow clone because installer hit a temporary directory conflict)
- `define-goal`
- `playwright`
- `playwright-interactive`
- `security-best-practices`
- `security-threat-model`
- `gh-fix-ci`
- `figma-generate-design`
- `figma-implement-design`
- `figma-create-design-system-rules`
- `webapp-testing` (from `ComposioHQ/awesome-codex-skills`; copied from local shallow clone because installer hit a temporary directory conflict)

Restart Codex to pick up new skills.

## Project-Specific Skills

项目专用 skills 放在 `.codex/skills/`：

- `manhole-demo-prd`
- `manhole-solution-architecture`
- `manhole-database-designer`
- `manhole-backend-api-engineer`
- `manhole-frontend-demo-engineer`
- `manhole-ui-ux-demo-designer`
- `manhole-diagnosis-mock`
- `manhole-qa-validation`
- `manhole-devops-local-runner`
- `manhole-code-review`

## Project Agents

项目级 agents 放在 `.codex/agents/`。通用工程 agent 来自 `VoltAgent/awesome-codex-subagents`，项目专用 agent 是：

- `domain-product-owner`
- `ai-diagnosis-mock-engineer`

## Next Command Prompt

后续开始第一阶段时，可以直接让 Codex 执行：

```text
请阅读 AGENTS.md、references/solution.md、references/demo-requirements.md。
先不要写业务代码。
请按 Phase 1 执行设计冻结：
1. 使用 domain-product-owner agent 和 manhole-demo-prd skill 输出 docs/generated/PRD.md；
2. 使用 api-designer agent 和 manhole-solution-architecture skill 输出 docs/generated/ARCHITECTURE.md；
3. 使用 ui-designer agent 和 manhole-ui-ux-demo-designer skill 输出 docs/generated/UI_SPEC.md；
4. 汇总冲突点并更新 references/acceptance-criteria.md。
```
