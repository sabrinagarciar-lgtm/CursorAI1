#!/usr/bin/env bash
# Promote green to blue after successful health checks.
set -euo pipefail

SHA="${GREEN_SHA:-${GITHUB_SHA}}"
REGISTRY="${REGISTRY:-ghcr.io}"
REPO_LOWER="$(echo "${GITHUB_REPOSITORY}" | tr '[:upper:]' '[:lower:]')"
IMAGE_BACKEND="${IMAGE_BACKEND:-${REGISTRY}/${REPO_LOWER}/shopease-backend}"
IMAGE_FRONTEND="${IMAGE_FRONTEND:-${REGISTRY}/${REPO_LOWER}/shopease-frontend}"

echo "Promoting green (${SHA}) to blue/production."

if [ -n "${DEPLOY_WEBHOOK_BLUE:-}" ]; then
  curl -fsSL -X POST "${DEPLOY_WEBHOOK_BLUE}" \
    -H "Content-Type: application/json" \
    -d "{\"ref\":\"${SHA}\",\"slot\":\"blue\",\"promote\":true,\"backend\":\"${IMAGE_BACKEND}:blue-${SHA}\",\"frontend\":\"${IMAGE_FRONTEND}:blue-${SHA}\"}"
else
  echo "DEPLOY_WEBHOOK_BLUE not set — simulating promote to production."
fi

echo "promoted_sha=${SHA}" >> "${GITHUB_OUTPUT}"
