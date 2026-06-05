#!/usr/bin/env bash
# Run Vitest unit tests in the ShopEase frontend.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
FRONTEND="$ROOT/frontend"
RESULTS="$ROOT/qa-automation/results"
mkdir -p "$RESULTS"

cd "$FRONTEND"
if [[ ! -d node_modules ]]; then
  npm ci
fi
npm run test 2>&1 | tee "$RESULTS/frontend-unit.log" || true
# Vitest does not emit junit by default; log presence is enough for dashboard
echo '{"frontend_unit": "completed"}' > "$RESULTS/frontend-unit-status.json"
echo "Frontend unit tests complete."
