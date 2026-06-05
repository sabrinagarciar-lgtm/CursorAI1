#!/usr/bin/env bash
# Run Playwright E2E against a running deployment (or auto-start via webServer)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

# Use system Playwright browsers (not sandbox cache)
unset PLAYWRIGHT_BROWSERS_PATH

if ! curl -sf http://127.0.0.1:5060/healthz >/dev/null 2>&1; then
  echo "Backend not running — Playwright will start servers via webServer config."
else
  echo "Reusing running backend at :5060"
  export PW_SKIP_WEBSERVER=1
fi

mkdir -p "$ROOT/docs/playwright-results"
npx playwright test --reporter=list,json --workers=1 --output="$ROOT/docs/playwright-results" \
  | tee "$ROOT/docs/playwright-results/last-run.log"

# Save JSON report from stdout tail if needed
echo "Results saved to docs/playwright-results/"
