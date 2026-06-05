# 谛听 · 管井及周边道路智能监测管理平台 Demo

“谛听”是一个面向市政道路管井运维场景的客户演示 Demo，用于展示从多源监测、AI 风险研判、处置工单、施工监管到验收归档的完整闭环。

当前 Demo 已完成可本地运行和公网访问的主流程，适合用于客户路演、方案沟通和内部产品验证。它不是生产系统，也不连接真实 GIS、传感器、雷达模型或客户数据库。

## Demo 要表达什么

客户看完以后，应形成四个直接认知：

1. **看得见**：管井周边高差、声振、雷达异常和历史维修记录可以集中到一井一档，不再只靠人工经验判断。
2. **判得准**：平台把多源证据转成风险评分、病害等级、异常范围、置信度和推荐工法。
3. **派得下去**：AI 研判结果可以生成处置方案，明确工法、材料、注浆孔位、注浆量和开放交通目标。
4. **收得回来**：施工过程、修复前后指标、验收结论和复检建议沉淀为“一井一档”。

## 当前演示范围

平台按 PPT 中“监测管理平台”的思路补齐了四层表达：

| 层级 | Demo 中的表达 |
| --- | --- |
| 数据采集层 | 智能井盖传感器、AI 视觉巡检、探地雷达、历史维修记录 |
| AI 诊断基座 | 风险评分、病害等级、热力图、异常分区、推荐工法 |
| 监测管理平台 | 监测总览、GIS 告警态势、一井一档、统计指标、闭环进度 |
| 工单处置移动端 | 现场工单示意：接单、布孔复核、分级注浆、验收拍照 |

核心页面：

- `/dashboard`：监测总览、重点告警井、四层平台架构、移动工单示意。
- `/map`：GIS 告警态势，按风险等级展示检查井点位。
- `/manholes/mh-0007`：固定演示井 `JW-A-0007` 的一井一档。
- `/manholes/mh-0007/diagnosis`：AI 风险研判、进度动画、病害热力图。
- `/manholes/mh-0007/plan`：处置方案、材料、孔位和开放交通目标。
- `/manholes/mh-0007/simulation`：施工过程监管和四步处置时间线。
- `/manholes/mh-0007/acceptance`：一井一档验收归档和修复前后对比。
- `/demo-script`：路演讲解脚本和固定演示路线。

## 固定客户演示路线

推荐演示固定使用高风险井 `JW-A-0007 / mh-0007`：

```text
/dashboard
  -> /map
  -> 选择 JW-A-0007
  -> /manholes/mh-0007
  -> /manholes/mh-0007/diagnosis?autorun=1
  -> /manholes/mh-0007/plan
  -> /manholes/mh-0007/simulation
  -> /manholes/mh-0007/acceptance
  -> /demo-script
```

推荐讲解顺序：

1. 在 `/dashboard` 先讲“谛听不是单井维修页面，而是监测管理平台”。
2. 用“四层架构”说明数据采集层、AI 诊断基座、监测管理平台、工单处置移动端。
3. 在 `/map` 选择 `JW-A-0007`，进入二级告警井案例。
4. 在一井一档解释高差、声振、雷达异常和历史维修记录。
5. 触发 AI 风险研判，展示 C 级病害、异常分区和推荐工法。
6. 生成处置方案，讲微孔注浆、井座锁固、快硬材料恢复。
7. 展示施工监管和验收归档，用修复前后指标证明闭环价值。

## 已实现功能

- FastAPI 后端 API。
- Next.js 前端 Demo。
- 20 座以上稳定 seed 检查井数据。
- A/B/C/D 病害等级样例。
- 确定性 Mock AI 诊断规则。
- 风险地图、单井详情、诊断、处置方案、施工模拟、验收报告主流程。
- 前端 API fallback，后端不可用时不白屏。
- API tests、lint、Next build、Playwright demo flow。
- Vercel 前后端部署。

## Mock 边界

当前仍为演示系统：

- AI 诊断是确定性规则模型，不是真实 AI 模型。
- GIS 点位、雷达异常、声振、施工和验收数据均为模拟数据。
- 后端使用进程内 seed/mock 状态，不做生产级持久化。
- Vercel 后端冷启动或实例切换后会回到 seed 数据。
- 工单移动端目前是平台内示意，不是独立移动端应用。

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

如果前端提示“请先启动后端服务”，先确认 `scripts/start-backend.sh` 正在运行，并且 `http://127.0.0.1:8000/openapi.json` 可访问。

## 线上客户演示地址

- Web Demo: `https://diting-platform.vercel.app/dashboard`
- FastAPI Backend: `https://fortunes-manhole-api.vercel.app`
- Hosted OpenAPI JSON: `https://fortunes-manhole-api.vercel.app/openapi.json`

历史地址 `https://fortunes-manhole-demo.vercel.app/dashboard` 目前仍可访问，但对外分享建议使用 `https://diting-platform.vercel.app/dashboard`。

当前线上 Web Demo 已配置：

```text
NEXT_PUBLIC_API_BASE_URL=https://fortunes-manhole-api.vercel.app/api/v1
NEXT_PUBLIC_USE_MOCK=false
```

## 本地开发命令

后端启动：

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e '.[dev]'
python -m uvicorn services.api.app.main:app --reload
```

前端稳定演示模式：

```bash
npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 NEXT_PUBLIC_USE_MOCK=false npm run build
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 NEXT_PUBLIC_USE_MOCK=false npm run start --workspace @fortunes/web -- -H 127.0.0.1 -p 3001
```

开发调试可用 `npm run dev`。不要在 `npm run dev` 正在运行时执行 `npm run build`，否则 Next.js 的 `.next` 热更新产物可能被改写，导致 dev 页面出现 overlay。

测试：

```bash
. .venv/bin/activate
python -m pytest -p no:capture tests/api -q
npm run lint
npm run build
WEB_BASE_URL=http://127.0.0.1:3001 API_BASE_URL=http://127.0.0.1:8000 python tests/e2e/local_demo_smoke.py
WEB_BASE_URL=http://127.0.0.1:3001 python tests/e2e/playwright_demo_flow.py
```

## Vercel 部署

前端项目：

```bash
vercel apps/web --prod --yes --name diting-platform
```

后端项目：

```bash
vercel . --prod --yes --project fortunes-manhole-api -A vercel.backend.json
```

更新前端生产环境变量后需要重新部署前端：

```bash
vercel env add NEXT_PUBLIC_API_BASE_URL production --value https://fortunes-manhole-api.vercel.app/api/v1 --yes --no-sensitive --cwd apps/web
vercel env add NEXT_PUBLIC_USE_MOCK production --value false --yes --no-sensitive --cwd apps/web
vercel apps/web --prod --yes --name diting-platform
```

## 项目结构

```text
AGENTS.md                         项目级 Codex 工作规则
docs/generated/                   PRD、API、数据库、UI、实现说明和 Release notes
references/                       固定业务上下文、验收标准、资源清单
apps/web/                         Next.js 前端 Demo
services/api/                     FastAPI 后端
packages/domain/                  预留共享领域模型
packages/ui/                      预留共享 UI 组件
packages/shared/                  预留 shared schema/client
tests/api/                        API 测试
tests/e2e/                        本地和 Playwright 演示流测试
assets/demo/                      Demo 素材占位
```

## Release Notes

详见 [docs/generated/RELEASE_NOTES.md](docs/generated/RELEASE_NOTES.md)。
