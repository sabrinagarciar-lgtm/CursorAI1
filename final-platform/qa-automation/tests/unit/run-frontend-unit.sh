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
npm run test 2>&1 | tee "$RESULTS/frontend-unit.log"
echo "Frontend unit tests complete."
