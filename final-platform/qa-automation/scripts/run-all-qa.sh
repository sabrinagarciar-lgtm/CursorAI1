#!/usr/bin/env bash
# Master QA execution script for ShopEase 8_1 e-commerce
# Usage: ./scripts/run-all-qa.sh [--skip-e2e] [--skip-security] [--skip-performance] [--unit-only]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_ROOT="$(cd "$QA_ROOT/.." && pwd)"
RESULTS="$QA_ROOT/results"
mkdir -p "$RESULTS"/{security,performance}

SKIP_E2E=false
SKIP_SECURITY=false
SKIP_PERFORMANCE=false
UNIT_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --skip-e2e) SKIP_E2E=true ;;
    --skip-security) SKIP_SECURITY=true ;;
    --skip-performance) SKIP_PERFORMANCE=true ;;
    --unit-only) UNIT_ONLY=true ;;
    --performance-only)
      SKIP_E2E=true
      UNIT_ONLY=true
      SKIP_SECURITY=true
      ;;
    -h|--help)
      echo "Usage: $0 [--skip-e2e] [--skip-security] [--skip-performance] [--unit-only] [--performance-only]"
      exit 0
      ;;
  esac
done

log() { echo -e "\n\033[1;36m[qa]\033[0m $*"; }
failures=0

cd "$QA_ROOT"

# --- Dependencies ---
setup_deps() {
  log "Installing QA Node dependencies..."
  if [[ ! -d node_modules ]]; then npm ci --silent 2>/dev/null || npm install --silent; fi
  npx playwright install chromium --with-deps 2>/dev/null || npx playwright install chromium

  log "Setting up Python QA venv..."
  if [[ ! -d .venv ]]; then
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements-qa.txt
  fi
  if [[ ! -d "$APP_ROOT/backend/.venv" ]]; then
    python3 -m venv "$APP_ROOT/backend/.venv"
    "$APP_ROOT/backend/.venv/bin/pip" install -q -r "$APP_ROOT/backend/requirements.txt"
  fi
}

# --- Code quality ---
run_quality() {
  log "ESLint (frontend)..."
  npm run lint:frontend || ((failures++))

  log "Pylint (backend)..."
  "$APP_ROOT/backend/.venv/bin/pip" install -q pylint radon 2>/dev/null || true
  "$APP_ROOT/backend/.venv/bin/pylint" "$APP_ROOT/backend/app" \
    --rcfile="$QA_ROOT/quality/pylint.rc" \
    --output-format=json >"$RESULTS/pylint-report.json" 2>/dev/null || true

  log "Radon complexity..."
  "$QA_ROOT/.venv/bin/radon" cc "$APP_ROOT/backend/app" -j -a >"$RESULTS/radon-complexity.json" 2>/dev/null || \
    "$APP_ROOT/backend/.venv/bin/radon" cc "$APP_ROOT/backend/app" -j -a >"$RESULTS/radon-complexity.json" 2>/dev/null || true
}

# --- Unit tests ---
run_unit() {
  log "Backend unit tests..."
  bash "$QA_ROOT/tests/unit/run-backend-unit.sh" || ((failures++))

  log "Frontend unit tests (Vitest)..."
  bash "$QA_ROOT/tests/unit/run-frontend-unit.sh" || log "WARN: frontend unit tests had failures"
}

# --- Integration tests ---
run_integration() {
  log "Integration tests..."
  "$APP_ROOT/backend/.venv/bin/pip" install -q -r "$QA_ROOT/requirements-qa.txt" 2>/dev/null || true
  cd "$QA_ROOT/tests/integration"
  PYTHONPATH="$APP_ROOT/backend" \
    "$APP_ROOT/backend/.venv/bin/pytest" . \
    --junitxml="$RESULTS/integration-junit.xml" \
    -q || ((failures++))
  cd "$QA_ROOT"
}

# --- E2E (Playwright + POM) ---
run_e2e() {
  if $SKIP_E2E; then
    log "Skipping E2E (--skip-e2e)"
    return
  fi
  log "Starting backend for E2E..."
  BACKEND_PID=""
  if ! curl -sf "${API_BASE_URL:-http://127.0.0.1:5060}/api/products" >/dev/null 2>&1; then
    cd "$APP_ROOT/backend"
    .venv/bin/python run.py &
    BACKEND_PID=$!
    sleep 2
    cd "$QA_ROOT"
  fi

  log "Starting frontend for E2E..."
  FRONTEND_PID=""
  if ! curl -sf "${E2E_BASE_URL:-http://127.0.0.1:5180}/" >/dev/null 2>&1; then
    cd "$APP_ROOT/frontend"
    [[ -d node_modules ]] || npm ci --silent
    npm run preview -- --host 127.0.0.1 --port 5180 &
    FRONTEND_PID=$!
    for _ in $(seq 1 30); do
      curl -sf "http://127.0.0.1:5180/" >/dev/null 2>&1 && break
      sleep 1
    done
    cd "$QA_ROOT"
  fi

  log "Playwright E2E (Page Object Model)..."
  npx playwright test || ((failures++))

  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" 2>/dev/null || true
}

# --- Security ---
run_security() {
  if $SKIP_SECURITY; then
    log "Skipping security (--skip-security)"
    return
  fi
  log "Security scans..."
  bash "$QA_ROOT/security/security-scan.sh" || ((failures++))
}

# --- Performance ---
run_performance() {
  if $SKIP_PERFORMANCE; then
    log "Skipping performance (--skip-performance)"
    return
  fi
  if ! curl -sf "${API_BASE_URL:-http://127.0.0.1:5060}/api/products" >/dev/null 2>&1; then
    log "WARN: API not running — start backend on 5060 for k6"
  fi
  if command -v k6 &>/dev/null; then
    log "k6 load test..."
    cd "$QA_ROOT"
    k6 run performance/k6-load-test.js || ((failures++))
  else
    log "SKIP k6 — not installed (https://k6.io/docs/get-started/installation/)"
    echo '{"skipped": true}' >"$RESULTS/performance/k6-summary.json"
  fi
  if command -v lhci &>/dev/null && curl -sf "${E2E_BASE_URL:-http://127.0.0.1:5180}/" >/dev/null 2>&1; then
    log "Lighthouse CI..."
    lhci autorun --config=performance/lighthouse.config.js || true
  fi
}

# --- Reports ---
run_reports() {
  log "Generating quality dashboard and metrics..."
  "$QA_ROOT/.venv/bin/python" "$QA_ROOT/reports/generate-report.py" || true
  "$QA_ROOT/.venv/bin/python" "$QA_ROOT/scripts/analyze-results.py" || true
  log "Syncing QA assets into frontend dist (for /qa-dashboard route)..."
  if [[ -d "$APP_ROOT/frontend/public" ]]; then
    cd "$APP_ROOT/frontend" && npm run build --silent 2>/dev/null || npm run build
  fi
}

# --- Main ---
setup_deps
run_quality

if $UNIT_ONLY; then
  run_unit
else
  run_unit
  run_integration
  run_e2e
  run_security
  run_performance
fi

run_reports

log "Done. Dashboard: file://$RESULTS/dashboard.html"
log "Artifacts: $RESULTS"
exit $failures
