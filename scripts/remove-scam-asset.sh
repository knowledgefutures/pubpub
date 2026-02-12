#!/bin/bash

# script to remove scam/malicious assets from assets.pubpub.org
# moves to quarantine bucket, invalidates cloudfront cache, logs the removal

set -euo pipefail

SOURCE_BUCKET="assets.pubpub.org"
SCAM_BUCKET="reported-scams"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
LOG_FILE="${LOG_FILE:-/tmp/scam-removals.log}"

usage() {
    echo "Usage: $0 <object-key> [reason]"
    echo ""
    echo "Examples:"
    echo "  $0 uploads/some-scam-file.pdf 'robux scam'"
    echo "  $0 'path/to/file.html' 'phishing page'"
    echo ""
    echo "Environment variables:"
    echo "  CLOUDFRONT_DISTRIBUTION_ID - CloudFront distribution to invalidate (optional)"
    echo "  LOG_FILE - Path to log file (default: /tmp/scam-removals.log)"
    exit 1
}

if [[ $# -lt 1 ]]; then
    usage
fi

OBJECT_KEY="$1"
REASON="${2:-unspecified}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

OBJECT_KEY=$(echo "$OBJECT_KEY" | sed -E 's|^https?://[^/]+/||')

echo "Processing: s3://${SOURCE_BUCKET}/${OBJECT_KEY}"

# check if object exists
if ! aws s3api head-object --bucket "$SOURCE_BUCKET" --key "$OBJECT_KEY" 2>/dev/null; then
    echo "Error: Object not found in ${SOURCE_BUCKET}"
    exit 1
fi

# copy to quarantine bucket with metadata
echo "Moving to quarantine bucket..."
aws s3 cp \
    "s3://${SOURCE_BUCKET}/${OBJECT_KEY}" \
    "s3://${SCAM_BUCKET}/${OBJECT_KEY}" \
    --metadata "removed-at=${TIMESTAMP},reason=${REASON},original-bucket=${SOURCE_BUCKET}" \
    --metadata-directive REPLACE

# delete from source bucket
echo "Removing from source bucket..."
aws s3 rm "s3://${SOURCE_BUCKET}/${OBJECT_KEY}"

# invalidate cloudfront cache if distribution id is set
if [[ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/${OBJECT_KEY}" \
        --output text
else
    echo "Warning: CLOUDFRONT_DISTRIBUTION_ID not set, skipping cache invalidation"
fi

# log the removal
LOG_ENTRY="${TIMESTAMP}|${OBJECT_KEY}|${REASON}"
echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "Logged to: $LOG_FILE"

echo "Done. Object quarantined successfully."
