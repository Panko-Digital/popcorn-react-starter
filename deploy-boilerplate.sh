#!/usr/bin/env bash
# deploy-boilerplate.sh
# Build the React boilerplate with an absolute CDN base URL and upload the
# resulting assets to GCS so published sites can load live content.
#
# Usage:
#   ./deploy-boilerplate.sh
#
# Required env vars (or set defaults below):
#   GCS_BUCKET          — GCS bucket name (default: popkorns-heights)
#   BOILERPLATE_VERSION — version path inside bucket (default: v1)
#
# The CDN base URL is derived from the bucket + version, e.g.:
#   https://storage.googleapis.com/popkorns-heights/boilerplate/v1/

set -euo pipefail

BUCKET="${GCS_BUCKET:-popkorns-heights}"
VERSION="${BOILERPLATE_VERSION:-v1}"
GCS_PATH="gs://${BUCKET}/boilerplate/${VERSION}"
CDN_BASE="https://storage.googleapis.com/${BUCKET}/boilerplate/${VERSION}/"

echo "Building boilerplate with CDN base: ${CDN_BASE}"
VITE_CDN_BASE="${CDN_BASE}" npm run build

echo "Uploading assets to ${GCS_PATH}/assets/ ..."
gcloud storage cp -r dist/assets "${GCS_PATH}/"

echo "Setting public-read IAM on uploaded files (if needed)..."
gcloud storage objects update "${GCS_PATH}/assets/**" \
  --add-acl-grant=entity=AllUsers,role=READER 2>/dev/null || true

echo "Done. Boilerplate assets available at:"
echo "  ${CDN_BASE}assets/index.js"
echo "  ${CDN_BASE}assets/index.css  (may have a hash suffix)"
