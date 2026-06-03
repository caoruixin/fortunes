#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8000}"
WEB_BASE_URL="${WEB_BASE_URL:-http://127.0.0.1:3001}"
PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE_URL:-${API_BASE_URL}/api/v1}"

cd "${ROOT_DIR}"

fail() {
  echo "[check-demo] FAIL: $*" >&2
  exit 1
}

pass() {
  echo "[check-demo] PASS: $*"
}

echo "[check-demo] checking local demo prerequisites"

[[ -d "${VENV_DIR}" ]] || fail "missing Python virtualenv ${VENV_DIR}"
pass "Python virtualenv exists"

if [[ -z "${NEXT_PUBLIC_API_BASE_URL:-}" ]]; then
  echo "[check-demo] WARN: NEXT_PUBLIC_API_BASE_URL is not set in this shell; using ${PUBLIC_API_BASE} for checks"
else
  pass "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"
fi

curl -fsS "${API_BASE_URL}/openapi.json" >/dev/null 2>&1 || fail "backend ${API_BASE_URL} is not reachable"
pass "backend port 8000 is reachable"

curl -fsS "${PUBLIC_API_BASE}/dashboard/summary" >/dev/null 2>&1 || fail "API base ${PUBLIC_API_BASE} is not reachable"
pass "API base path is reachable"

curl -fsS "${WEB_BASE_URL}/dashboard" >/dev/null 2>&1 || fail "frontend ${WEB_BASE_URL} is not reachable"
pass "frontend port 3001 is reachable"

echo "[check-demo] running local smoke flow"
WEB_BASE_URL="${WEB_BASE_URL}" API_BASE_URL="${API_BASE_URL}" "${VENV_DIR}/bin/python" tests/e2e/local_demo_smoke.py

echo "[check-demo] running browser demo flow"
WEB_BASE_URL="${WEB_BASE_URL}" "${VENV_DIR}/bin/python" tests/e2e/playwright_demo_flow.py

echo "[check-demo] demo checks completed"
