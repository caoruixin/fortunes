# Phase 2 Implementation Notes

更新时间：2026-06-02

## 本地技术栈

- Frontend: Next.js 15, React 19, TypeScript, CSS modules/global CSS style tokens.
- Backend: FastAPI, Pydantic v2, in-process seed store.
- Mock AI: deterministic weighted rule engine in `services/api/app/diagnosis_engine.py`.
- Tests: Pytest API/unit tests, HTTP smoke script, Playwright browser demo flow.
- 暂缓项：Docker、CI、安全审查、生产部署、PostgreSQL/PostGIS。

## 目录结构

```text
apps/web/                         Next.js routes and demo UI
services/api/app/                 FastAPI app, seed data, schemas, workflow
tests/api/                        API and diagnosis engine tests
tests/e2e/local_demo_smoke.py     Local web/API smoke validation
tests/e2e/playwright_demo_flow.py Browser click-flow validation for the fixed demo route
docs/generated/                   Phase 1 docs plus local acceptance notes
```

## 启动命令

后端：

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e '.[dev]'
python -m uvicorn services.api.app.main:app --reload
```

前端（客户演示推荐，稳定模式）：

```bash
npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 NEXT_PUBLIC_USE_MOCK=false npm run build
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 NEXT_PUBLIC_USE_MOCK=false npm run start --workspace @fortunes/web -- -H 127.0.0.1 -p 3001
```

开发调试可改用 `npm run dev`。不要在 dev server 运行时执行 `npm run build`，否则 `.next` 热更新产物可能被改写并触发 Next.js overlay。

入口：

- Web: `http://127.0.0.1:3001/dashboard`
- API docs: `http://127.0.0.1:8000/docs`

也可以使用本地脚本：

```bash
scripts/start-backend.sh
scripts/start-frontend.sh
scripts/check-demo.sh
```

## 实现范围

- Seed 数据：20 座检查井，覆盖 A/B/C/D 病害等级和 low/medium/high/critical 风险。
- 主演示井：`mh-0007`，C 级，展示微孔注浆、井座锁固、快硬材料恢复和 2 小时开放交通目标。
- API：实现 `/api/v1/dashboard/summary`、`/api/v1/map/manholes`、`/api/v1/manholes`、单井详情、诊断、方案、模拟、验收、路演脚本。
- 前端：实现 `/dashboard`、`/map`、`/manholes/[id]`、`/diagnosis`、`/plan`、`/simulation`、`/acceptance`、`/demo-script`。
- 真实 API 模式：前端 adapter 会将 FastAPI 合同响应规范化到页面领域类型，并在访问方案/模拟/验收页面时自动补齐必要派生资源。
- Mock 模式：未配置 `NEXT_PUBLIC_API_BASE_URL` 时，前端仍可用内置 mock 数据独立演示。

## 持久化说明

当前使用进程内 seed + 内存状态。页面刷新后核心数据可回读；后端服务重启后，POST 生成的诊断、方案和验收会回到 seed 初始状态。

未来切换路径：

1. 将 `services/api/app/seed.py` 的 seed 数据迁移到 SQLite fixture 或 PostgreSQL seed。
2. 用 repository 层替换 `RuntimeStore` 的内存 dict。
3. 保持现有 FastAPI endpoint 和前端 adapter 字段不变。
4. PostgreSQL/PostGIS 恢复时，按 `docs/generated/DATABASE_SCHEMA.md` 补 migration，并保留 WGS84 地图坐标与 local manhole plane 诊断坐标的边界。
