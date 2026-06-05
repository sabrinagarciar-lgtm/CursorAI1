#!/usr/bin/env bash
# Security scanning: Snyk (dependencies) + OWASP ZAP (DAST)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_ROOT="$(cd "$QA_ROOT/.." && pwd)"
RESULTS="$QA_ROOT/results/security"
mkdir -p "$RESULTS"

TARGET_URL="${TARGET_URL:-http://127.0.0.1:5180}"
API_URL="${API_BASE_URL:-http://127.0.0.1:5060}"
SNYK_EXIT=0
ZAP_EXIT=0
BANDIT_EXIT=0

log() { echo "[security] $*"; }

# --- Snyk dependency scan ---
run_snyk() {
  if ! command -v snyk &>/dev/null; then
    log "SKIP Snyk — CLI not installed (https://docs.snyk.io/snyk-cli/install-the-snyk-cli)"
    echo '{"skipped": true, "reason": "snyk CLI not found"}' >"$RESULTS/snyk-report.json"
    return 0
  fi
  if [[ -z "${SNYK_TOKEN:-}" ]]; then
    log "SKIP Snyk — SNYK_TOKEN not set (optional for local dev)"
    echo '{"skipped": true, "reason": "SNYK_TOKEN unset"}' >"$RESULTS/snyk-report.json"
    return 0
  fi
  log "Running Snyk on frontend and backend..."
  (
    cd "$APP_ROOT/frontend"
    snyk test --json-file-output="$RESULTS/snyk-frontend.json" --severity-threshold=high || SNYK_EXIT=$?
  )
  (
    cd "$APP_ROOT/backend"
    snyk test --file=requirements.txt --json-file-output="$RESULTS/snyk-backend.json" --severity-threshold=high || SNYK_EXIT=$?
  )
  python3 - <<'PY' "$RESULTS"
import json, sys
from pathlib import Path
out = Path(sys.argv[1])
merged = {"vulnerabilities": [], "critical": 0, "high": 0, "medium": 0, "low": 0}
for name in ("snyk-frontend.json", "snyk-backend.json"):
    p = out / name
    if not p.exists():
        continue
    data = json.loads(p.read_text())
    if data.get("skipped"):
        continue
    for v in data.get("vulnerabilities", []):
        merged["vulnerabilities"].append(v)
        sev = (v.get("severity") or "").lower()
        if sev in merged:
            merged[sev] += 1
(out / "snyk-report.json").write_text(json.dumps(merged, indent=2))
PY
  return "$SNYK_EXIT"
}

# --- Bandit static analysis (Python, no token required) ---
run_bandit() {
  if [[ ! -x "$APP_ROOT/backend/.venv/bin/bandit" ]] && ! command -v bandit &>/dev/null; then
    log "Installing bandit in backend venv..."
    "$APP_ROOT/backend/.venv/bin/pip" install -q bandit 2>/dev/null || pip3 install -q bandit
  fi
  BANDIT_BIN="${APP_ROOT}/backend/.venv/bin/bandit"
  [[ -x "$BANDIT_BIN" ]] || BANDIT_BIN="bandit"
  log "Running Bandit on backend/app..."
  "$BANDIT_BIN" -r "$APP_ROOT/backend/app" -f json -o "$RESULTS/bandit-report.json" -ll || BANDIT_EXIT=$?
}

# --- OWASP ZAP (Docker) ---
run_zap() {
  if ! command -v docker &>/dev/null; then
    log "SKIP ZAP — Docker not available"
    echo '{"skipped": true, "reason": "docker not found"}' >"$RESULTS/zap-report.json"
    return 0
  fi
  if ! curl -sf "$TARGET_URL" >/dev/null 2>&1; then
    log "WARN ZAP — target $TARGET_URL not reachable; skipping active scan"
    echo "{\"skipped\": true, \"reason\": \"target unreachable\", \"url\": \"$TARGET_URL\"}" >"$RESULTS/zap-report.json"
    return 0
  fi
  log "Running OWASP ZAP automation (Docker)..."
  docker run --rm -v "$QA_ROOT/security:/zap/wrk:ro" -v "$RESULTS:/zap/results:rw" \
    -e TARGET_URL="$TARGET_URL" \
    ghcr.io/zaproxy/zaproxy:stable zap.sh -cmd \
    -autorun /zap/wrk/zap-config.yaml 2>&1 | tee "$RESULTS/zap-scan.log" || ZAP_EXIT=$?
  return "$ZAP_EXIT"
}

run_bandit
run_snyk || true
run_zap || true

log "Security artifacts written to $RESULTS"
if [[ "$SNYK_EXIT" -ne 0 ]] || [[ "$ZAP_EXIT" -ne 0 ]] || [[ "$BANDIT_EXIT" -ne 0 ]]; then
  log "Security scan completed with findings (exit may be non-zero in CI)"
  exit 1
fi
log "Security scan completed."
exit 0
