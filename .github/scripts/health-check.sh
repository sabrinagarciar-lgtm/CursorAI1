#!/usr/bin/env bash
# Poll health endpoints until ready or timeout.
set -euo pipefail

BACKEND_URL="${GREEN_BACKEND_URL:-${HEALTH_CHECK_BACKEND_URL:-}}"
FRONTEND_URL="${GREEN_FRONTEND_URL:-${HEALTH_CHECK_FRONTEND_URL:-}}"
MAX_ATTEMPTS="${HEALTH_CHECK_RETRIES:-12}"
INTERVAL="${HEALTH_CHECK_INTERVAL:-5}"

check_url() {
  local name="$1"
  local url="$2"
  local attempt=1

  if [ -z "${url}" ]; then
    echo "${name}: URL not configured — skipping."
    return 0
  fi

  echo "Checking ${name} at ${url}"
  while [ "${attempt}" -le "${MAX_ATTEMPTS}" ]; do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      echo "${name}: healthy (attempt ${attempt})"
      return 0
    fi
    echo "${name}: not ready (attempt ${attempt}/${MAX_ATTEMPTS})"
    sleep "${INTERVAL}"
    attempt=$((attempt + 1))
  done

  echo "${name}: health check failed after ${MAX_ATTEMPTS} attempts"
  return 1
}

check_url "backend" "${BACKEND_URL}"
check_url "frontend" "${FRONTEND_URL}"

echo "health_status=passed" >> "${GITHUB_OUTPUT}"
