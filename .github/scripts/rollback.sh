#!/usr/bin/env bash
# Roll back to the last known-good blue deployment.
set -euo pipefail

PREVIOUS_SHA="${PREVIOUS_BLUE_SHA:-}"
REGISTRY="${REGISTRY:-ghcr.io}"
REPO_LOWER="$(echo "${GITHUB_REPOSITORY}" | tr '[:upper:]' '[:lower:]')"
IMAGE_BACKEND="${IMAGE_BACKEND:-${REGISTRY}/${REPO_LOWER}/shopease-backend}"
IMAGE_FRONTEND="${IMAGE_FRONTEND:-${REGISTRY}/${REPO_LOWER}/shopease-frontend}"

echo "::error::Deployment failed — initiating rollback."

if [ -z "${PREVIOUS_SHA}" ] || [ "${PREVIOUS_SHA}" = "none" ]; then
  echo "No PREVIOUS_BLUE_SHA available; cannot rollback automatically."
  exit 1
fi

if [ -n "${DEPLOY_WEBHOOK_BLUE:-}" ]; then
  curl -fsSL -X POST "${DEPLOY_WEBHOOK_BLUE}" \
    -H "Content-Type: application/json" \
    -d "{\"ref\":\"${PREVIOUS_SHA}\",\"slot\":\"blue\",\"rollback\":true,\"backend\":\"${IMAGE_BACKEND}:blue-${PREVIOUS_SHA}\",\"frontend\":\"${IMAGE_FRONTEND}:blue-${PREVIOUS_SHA}\"}"
else
  echo "DEPLOY_WEBHOOK_BLUE not set — simulating rollback to ${PREVIOUS_SHA}."
fi

echo "rollback_sha=${PREVIOUS_SHA}" >> "${GITHUB_OUTPUT}"
