#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-3001}"
WEB_URL="http://${FRONTEND_HOST}:${FRONTEND_PORT}"
API_URL="${API_BASE_URL:-http://127.0.0.1:8000}"

if [[ -z "${NEXT_PUBLIC_API_BASE_URL:-}" ]]; then
  export NEXT_PUBLIC_API_BASE_URL="${API_URL}/api/v1"
  echo "[frontend] NEXT_PUBLIC_API_BASE_URL was not set; using ${NEXT_PUBLIC_API_BASE_URL}"
else
  echo "[frontend] NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"
fi

export NEXT_PUBLIC_USE_MOCK="${NEXT_PUBLIC_USE_MOCK:-false}"

echo "[frontend] checking backend ${NEXT_PUBLIC_API_BASE_URL}/dashboard/summary"
if ! curl -fsS "${NEXT_PUBLIC_API_BASE_URL}/dashboard/summary" >/dev/null 2>&1; then
  echo "[frontend] backend is not reachable. Start it first:"
  echo "  scripts/start-backend.sh"
  exit 1
fi

if [[ ! -d "${ROOT_DIR}/node_modules" ]]; then
  echo "[frontend] missing node_modules. Run:"
  echo "  npm install"
  exit 1
fi

if curl -fsS "${WEB_URL}/dashboard" >/dev/null 2>&1; then
  echo "[frontend] already reachable at ${WEB_URL}"
  exit 0
fi

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"${FRONTEND_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[frontend] port ${FRONTEND_PORT} is already in use, but ${WEB_URL}/dashboard is not reachable"
  lsof -nP -iTCP:"${FRONTEND_PORT}" -sTCP:LISTEN || true
  exit 1
fi

echo "[frontend] building Next.js app for stable local demo"
npm run build

echo "[frontend] starting Next.js at ${WEB_URL}"
exec npm run start --workspace @fortunes/web -- -H "${FRONTEND_HOST}" -p "${FRONTEND_PORT}"
