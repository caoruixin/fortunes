# Release Notes

## 2026-06-05 · 谛听平台演示叙事增强

版本对比：

- 上一版本：`3b9b288 Rebrand demo as Diting monitoring platform`
- 本次功能版本：`0f4c259 Polish Diting platform demo narrative`
- 生产地址：`https://diting-platform.vercel.app/dashboard`

### 发布目标

上一版本已经完成从“井周智修”到“谛听”的命名和页面主线调整。本版本继续补齐客户演示叙事，让 Demo 更接近 PPT 中“监测管理平台”的整体思路，而不是只呈现单井 AI 诊修工具。

### 主要变化

#### 0. 对外演示域名更新

前端 Vercel 项目已重命名为 `diting-platform`，推荐对外分享：

- `https://diting-platform.vercel.app/dashboard`

历史地址 `https://fortunes-manhole-demo.vercel.app/dashboard` 目前仍可访问，但后续客户沟通建议统一使用新域名。

#### 1. 首页补齐平台级定位

`/dashboard` 新增“谛听平台四层架构”，把 Demo 能力解释为：

- 数据采集层：井盖传感器、AI 摄像、雷达巡检。
- AI 诊断基座：多源融合、风险评分、病害识别。
- 监测管理平台：GIS 态势、一井一档、统计分析。
- 工单处置移动端：接单、采集、反馈、归档。

影响：客户进入首页后，可以先理解“谛听”是监测管理平台，再进入固定单井案例。

#### 2. 增加工单移动端演示表达

`/dashboard` 新增“工单处置移动端”示意卡片，展示：

- 现场工单 `JW-A-0007`。
- 二级告警 / C 级病害。
- 到场签到、布孔复核、分级注浆、验收拍照。
- 预计 2 小时开放交通。

影响：补齐 PPT 中“工单处置移动端”的表达，但不新增独立移动端应用，避免扩大开发范围。

#### 3. 强化路演讲解脚本

`/demo-script` 新增：

- “开场 30 秒定位”：一句话、四层能力、固定案例。
- “客户侧价值表达”：看得见、判得准、派得下去、收得回来。

影响：路演人员可以直接按页面讲，不需要额外准备大段口播。

#### 4. 轻量品牌标识

侧边栏新增“谛听”轻量品牌标识，使用本地 CSS 实现，不依赖外部图片、Figma 或新增素材。

影响：提升客户演示感，同时保持离线和 Vercel 部署稳定。

### 变更文件

- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/demo-script/page.tsx`
- `apps/web/src/app/globals.css`

### 未变化内容

- 后端业务 API 未变化。
- Mock AI 规则未变化。
- 固定演示井仍为 `JW-A-0007 / mh-0007`。
- 固定演示路线未变化。
- 未引入 Docker、CI 或复杂新依赖。

补充：为支持新前端域名访问，后端 CORS allowlist 增加了 `https://diting-platform.vercel.app`。

### 验证结果

本版本发布前已验证：

- `npm run lint` 通过。
- API tests：`14 passed`。
- Next production build 通过。
- 本地 Playwright demo flow 通过。
- 公网页面 smoke 通过，确认新增模块已出现在 `/dashboard` 和 `/demo-script`。
- 公网 Playwright demo flow 通过。

### 已知边界

- 工单处置移动端目前是平台内演示示意，不是独立 App。
- 四层架构是演示级可视化，不是正式产品架构图。
- 数据、AI 研判、GIS 点位、雷达和验收报告仍为 Mock/seed 数据。
