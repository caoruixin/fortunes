# Design Freeze Summary

生成日期：2026-06-02

本轮基于 `AGENTS.md`、`references/solution.md`、`references/demo-requirements.md`、`references/domain-glossary.md`、`references/acceptance-criteria.md` 执行 Design Freeze。已显式 spawn 并等待以下 agents 完成：

- `domain-product-owner`：使用 `manhole-demo-prd`，产出 PRD。
- `api-designer`：产出 API 合同与 OpenAPI 草案。
- `postgres-pro`：使用 `manhole-database-designer`，产出数据库 schema、migration 和 seed 计划。
- `ui-designer`：使用 `manhole-ui-ux-demo-designer`，结合 Figma 相关 skill 约束，产出 UI_SPEC。

本轮只写设计文档，未写业务代码。

## 1. 生成文档

| 文件 | 用途 | 状态 |
| --- | --- | --- |
| `docs/generated/PRD.md` | 产品目标、用户故事、页面清单、验收标准、路演脚本 | 已生成，并已同步 API 命名 |
| `docs/generated/API_CONTRACT.md` | API 资源模型、端点、schema、错误模型、版本和幂等策略 | 已生成 |
| `docs/generated/openapi.draft.yaml` | OpenAPI 3.1 草案 | 已生成 |
| `docs/generated/DATABASE_SCHEMA.md` | ERD、核心表、枚举、PostGIS 字段、索引、migration SQL 草案、seed 计划 | 已生成 |
| `docs/generated/UI_SPEC.md` | 设计原则、路由布局、风险色系、组件清单、状态、响应式和 Figma-to-code 规则 | 已生成 |
| `docs/generated/DESIGN_FREEZE_SUMMARY.md` | 本轮汇总、冲突点和后续决策入口 | 已生成 |

## 2. 冻结的主流程

MVP 主流程按 8 个路由冻结：

```text
/dashboard
  -> /map
  -> /manholes/[id]
  -> /manholes/[id]/diagnosis
  -> /manholes/[id]/plan
  -> /manholes/[id]/simulation
  -> /manholes/[id]/acceptance
  -> /demo-script
```

默认路演主井为 C 级病害，用于展示：

- 无损检测与 AI 识别让井周地下病害可见；
- 输出风险评分、病害等级、热力图/polygon、推荐工法；
- 推荐“微孔注浆 + 井座锁固 + 快硬材料恢复”；
- 展示精准布孔、低压分级注浆、井座锁固与调平、快硬材料恢复；
- 生成“一井一档”验收报告。

D 级病害作为退出机制案例，不推荐单纯微创闭环，必须提示 CCTV 复核、局部开挖或管网修复。

## 3. 合同与数据源决策

1. P0 API 命名源为 `docs/generated/API_CONTRACT.md` 和 `docs/generated/openapi.draft.yaml`。
2. API base path 使用 `/api/v1`。
3. `diagnosis`、`plan`、`acceptance` 是挂在单井下的当前单例派生资源。
4. `simulation` 是对当前维修方案的只读投影。
5. 生成类接口使用显式版本字段和 `Idempotency-Key`，避免重试或旧页面覆盖新数据。
6. 地图坐标使用 `WGS84`；诊断热力图、井周 polygon、注浆孔位使用 `local_manhole_plane`。
7. 数据库使用 PostgreSQL/PostGIS，先以 `SRID 4326` 存储地图几何，真实面积/长度计算需 `ST_Transform()`。
8. seed 数据至少 20 座井，覆盖 A/B/C/D；`MH-DMO-008` 为完整高风险闭环示例，`MH-DMO-017` 为 D 级退出机制示例。

## 4. 已解决冲突

| 冲突 | 处理 |
| --- | --- |
| `demo-requirements.md` 描述 5 页叙事，`AGENTS.md` 要求 8 个 MVP 路由 | 冻结为 8 个实际路由，5 页视作对外讲解集合 |
| PRD 初稿使用 `/repair-plan`、`/acceptance-report`、`/latest`，API 草案使用 `/plan`、`/acceptance` 当前单例 | 已更新 PRD，使 OpenAPI 草案成为 P0 API 命名源 |
| “前端无后端时可 mock” 与“不允许只做静态页面”存在误读风险 | 明确 API、数据库、确定性 Mock AI 是验收口径；前端 mock adapter 只作为降级演示 |
| 对外降噪话术可能过度承诺 | 统一使用“验收状态下无明显跳动、空响和异常冲击声” |

## 5. 未决冲突与待确认

| 事项 | 当前建议 | 需要确认 |
| --- | --- | --- |
| 严格 Phase 1 是否必须补 `docs/generated/ARCHITECTURE.md` | 本轮已有 API、数据库、UI 三份设计，但尚未单独生成架构文档 | 如果按 AGENTS Phase 1 完整交付，需要追加架构文档 |
| 2 小时开放交通 | Demo 表达为示例或预计开放时间 | 用户需提供材料强度曲线、温湿度适用范围和企业推荐参数 |
| 验收阈值 | Demo 采用平整度 `<= 3mm`、高差约 `<= 2mm` 的示例目标 | 目标客户所在地标准可能要求 `<= 3mm`、`<= 5mm` 或其他阈值 |
| 地图后端是否需要 cluster | 当前 API 使用 `bbox + limit` 视口查询，不做 cluster 合同 | 若点位规模从 20 座扩展到数千座，需要补 cluster 策略 |
| `projectId` 是否暴露给前端 | MVP 可固定单项目，API 保留项目维度 | 若未来多项目演示，需要在前端筛选和路由中显式体现 |
| 路演脚本文案托管位置 | 当前 API 有 `/api/v1/demo-script` | 若商务频繁改稿，可能改为前端静态资源或 CMS 配置 |
| 验收报告导出 | 当前 OpenAPI 只定义结构化 JSON | 是否需要在 v1 预留 `pdfUrl` 或下载端点 |
| Figma 实际画布 | 当前没有目标 Figma 文件或 MCP 连接信息 | 若要生成 Figma 画布，需要用户提供文件 URL 或目标文件上下文 |
| 真实素材与坐标 | 默认使用虚构或脱敏数据 | 用户需提供授权照片、雷达示意、坐标脱敏策略、品牌素材 |

## 6. 验证记录

- 已确认 `docs/generated` 下生成 6 个设计文件。
- 已用 Ruby `YAML.load_file` 校验 `docs/generated/openapi.draft.yaml` 可解析。
- OpenAPI 草案当前包含 9 个主流程路径：
  - `/dashboard/summary`
  - `/map/manholes`
  - `/manholes`
  - `/manholes/{manholeId}`
  - `/manholes/{manholeId}/diagnosis`
  - `/manholes/{manholeId}/plan`
  - `/manholes/{manholeId}/simulation`
  - `/manholes/{manholeId}/acceptance`
  - `/demo-script`
- 未运行代码测试或 Docker 启动，因为本轮明确只做设计冻结文档。

## 7. 下一阶段建议

Foundation 阶段建议按以下顺序推进：

1. 补齐 `ARCHITECTURE.md`，明确前后端、数据库、Mock AI、报告、Docker Compose 的模块边界。
2. 基于 `openapi.draft.yaml` 生成 FastAPI 路由骨架和前端 shared types。
3. 将 `DATABASE_SCHEMA.md` 的 migration 草案落成实际 migration 和 seed。
4. 按 `UI_SPEC.md` 建 Next.js 路由骨架和核心布局。
5. 实现确定性 Mock AI 前，先冻结 A/B/C/D 评分规则和 fixture 对照表。
