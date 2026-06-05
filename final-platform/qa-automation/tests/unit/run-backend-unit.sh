#!/usr/bin/env bash
# Run backend unit tests (pytest test_unit.py) with coverage.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
BACKEND="$ROOT/backend"
RESULTS="$ROOT/qa-automation/results"
mkdir -p "$RESULTS"

cd "$BACKEND"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
  .venv/bin/pip install -q -r ../qa-automation/requirements-qa.txt
fi

.venv/bin/pytest tests/ \
  --cov=app \
  --cov-report=xml:"$RESULTS/backend-unit-coverage.xml" \
  --cov-report=term \
  --junitxml="$RESULTS/backend-unit-junit.xml" \
  -q

echo "Backend unit tests complete."
