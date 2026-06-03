# E2E 验证说明

当前仓库提供两类本地验收脚本：

- `local_demo_smoke.py`：HTTP/API smoke，验证页面返回、核心接口和派生资源稳定性。
- `playwright_demo_flow.py`：真实浏览器点击流，验证固定演示路线和客户端交互。

## 运行前提

- 后端本地可访问，默认 `http://127.0.0.1:8000`
- 前端本地可访问，默认 `http://127.0.0.1:3001`
- Python dev 依赖已安装：

```bash
. .venv/bin/activate
python -m pip install -e '.[dev]'
```

如果 Playwright 托管浏览器未安装，脚本会优先使用本机 Chrome fallback：

```text
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

## 推荐用法

优先直接运行总检查脚本：

```bash
scripts/check-demo.sh
```

它会依次检查：

- Python venv
- 后端 `8000`
- API base path
- 前端 `3001`
- HTTP smoke 主流程
- Playwright 浏览器主流程

## 单独运行

```bash
WEB_BASE_URL=http://127.0.0.1:3001 \
API_BASE_URL=http://127.0.0.1:8000 \
.venv/bin/python tests/e2e/local_demo_smoke.py
```

```bash
WEB_BASE_URL=http://127.0.0.1:3001 \
.venv/bin/python tests/e2e/playwright_demo_flow.py
```

## 覆盖范围

固定演示路线：

```text
/dashboard
  -> /map
  -> 选择 JW-A-0007 / mh-0007
  -> /manholes/mh-0007
  -> /manholes/mh-0007/diagnosis
  -> /manholes/mh-0007/plan
  -> /manholes/mh-0007/simulation
  -> /manholes/mh-0007/acceptance
  -> /demo-script
```

## 输出判定

- 全部通过：退出码 `0`
- 任一关键校验失败：退出码 `1`

Playwright 脚本现在不再缺依赖时静默跳过；若缺少 Python `playwright` 包，会直接失败并提示重新安装 dev 依赖。
