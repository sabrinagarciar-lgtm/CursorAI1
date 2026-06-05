#!/usr/bin/env bash
# Production-style local deployment for CursorHub Platform
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-5060}"
FRONTEND_PORT="${FRONTEND_PORT:-5180}"

echo "==> Building frontend..."
cd "$ROOT/frontend"
npm run build

echo "==> Starting backend on :$BACKEND_PORT..."
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt -q
fi
.venv/bin/python run.py &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

sleep 2
curl -sf "http://127.0.0.1:$BACKEND_PORT/healthz" > /dev/null
echo "    Backend healthy at http://127.0.0.1:$BACKEND_PORT"

echo "==> Starting frontend preview on :$FRONTEND_PORT..."
cd "$ROOT/frontend"
npm run preview -- --host 127.0.0.1 --port "$FRONTEND_PORT"
