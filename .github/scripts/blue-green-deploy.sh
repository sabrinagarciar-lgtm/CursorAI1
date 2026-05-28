#!/usr/bin/env bash
# Deploy to the green slot, record the previous blue SHA for rollback.
set -euo pipefail

REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_BACKEND="${IMAGE_BACKEND:-${REGISTRY}/${GITHUB_REPOSITORY}/shopease-backend}"
IMAGE_FRONTEND="${IMAGE_FRONTEND:-${REGISTRY}/${GITHUB_REPOSITORY}/shopease-frontend}"
SHA="${GITHUB_SHA}"

echo "Deploying green environment for commit ${SHA}"

if [ -n "${DEPLOY_WEBHOOK_GREEN:-}" ]; then
  curl -fsSL -X POST "${DEPLOY_WEBHOOK_GREEN}" \
    -H "Content-Type: application/json" \
    -d "{\"ref\":\"${SHA}\",\"slot\":\"green\",\"backend\":\"${IMAGE_BACKEND}:green-${SHA}\",\"frontend\":\"${IMAGE_FRONTEND}:green-${SHA}\"}"
else
  echo "DEPLOY_WEBHOOK_GREEN not set — simulating green deploy."
fi

echo "previous_blue_sha=${PREVIOUS_BLUE_SHA:-none}" >> "${GITHUB_OUTPUT}"
echo "green_sha=${SHA}" >> "${GITHUB_OUTPUT}"
