#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"

echo "[backend] checking Python virtualenv"
if [[ ! -d "${VENV_DIR}" ]]; then
  echo "[backend] missing ${VENV_DIR}"
  echo "[backend] create it with:"
  echo "  python3 -m venv .venv"
  echo "  . .venv/bin/activate"
  echo "  python -m pip install -e '.[dev]'"
  exit 1
fi

if curl -fsS "${BACKEND_URL}/openapi.json" >/dev/null 2>&1; then
  echo "[backend] already reachable at ${BACKEND_URL}"
  exit 0
fi

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"${BACKEND_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[backend] port ${BACKEND_PORT} is already in use, but ${BACKEND_URL}/openapi.json is not reachable"
  lsof -nP -iTCP:"${BACKEND_PORT}" -sTCP:LISTEN || true
  exit 1
fi

# shellcheck source=/dev/null
. "${VENV_DIR}/bin/activate"

echo "[backend] starting FastAPI at ${BACKEND_URL}"
exec python -m uvicorn services.api.app.main:app --host "${BACKEND_HOST}" --port "${BACKEND_PORT}"
