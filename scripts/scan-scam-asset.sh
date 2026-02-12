#!/bin/bash

# scan s3 bucket for objects matching scam keywords
# can run in dry-run mode to preview, or execute mode to quarantine

set -euo pipefail

SOURCE_BUCKET="assets.pubpub.org"
SCAM_BUCKET="reported-scams"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
LOG_FILE="${LOG_FILE:-/tmp/scam-removals.log}"

# keywords to flag as suspicious (case-insensitive)
SCAM_KEYWORDS=(
    "robux"
    "roblox"
    "insta-likes"
    "instagram-likes"
    "free-followers"
    "v-bucks"
    "vbucks"
    "fortnite-hack"
    "free-robux"
    "tiktok-followers"
    "hack-generator"
)

MODE="${1:-scan}"
PREFIX="${2:-}"

usage() {
    echo "Usage: $0 [scan|quarantine] [prefix]"
    echo ""
    echo "Modes:"
    echo "  scan       - List suspicious objects (default, dry-run)"
    echo "  quarantine - Move suspicious objects to scam bucket"
    echo ""
    echo "Examples:"
    echo "  $0 scan                    # scan entire bucket"
    echo "  $0 scan uploads/2024/      # scan specific prefix"
    echo "  $0 quarantine              # quarantine all matches"
    exit 1
}

if [[ "$MODE" == "-h" || "$MODE" == "--help" ]]; then
    usage
fi

build_pattern() {
    local pattern=""
    for keyword in "${SCAM_KEYWORDS[@]}"; do
        if [[ -z "$pattern" ]]; then
            pattern="$keyword"
        else
            pattern="${pattern}|${keyword}"
        fi
    done
    echo "$pattern"
}

PATTERN=$(build_pattern)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
MATCHES=()

echo "Scanning s3://${SOURCE_BUCKET}/${PREFIX} for scam keywords..."
echo "Pattern: ${PATTERN}"
echo ""

# list all objects and filter by pattern
while IFS= read -r line; do
    key=$(echo "$line" | awk '{print $4}')
    if [[ -z "$key" ]]; then
        continue
    fi
    
    # case-insensitive match
    if echo "$key" | grep -iE "$PATTERN" > /dev/null 2>&1; then
        MATCHES+=("$key")
        echo "MATCH: $key"
    fi
done < <(aws s3 ls "s3://${SOURCE_BUCKET}/${PREFIX}" --recursive 2>/dev/null || true)

echo ""
echo "Found ${#MATCHES[@]} suspicious objects"

if [[ ${#MATCHES[@]} -eq 0 ]]; then
    echo "No matches found."
    exit 0
fi

if [[ "$MODE" == "scan" ]]; then
    echo ""
    echo "Run with 'quarantine' mode to move these objects:"
    echo "  $0 quarantine ${PREFIX}"
    exit 0
fi

if [[ "$MODE" == "quarantine" ]]; then
    echo ""
    echo "Quarantining ${#MATCHES[@]} objects..."
    
    INVALIDATION_PATHS=()
    
    for key in "${MATCHES[@]}"; do
        echo "Processing: $key"
        
        # copy to quarantine
        aws s3 cp \
            "s3://${SOURCE_BUCKET}/${key}" \
            "s3://${SCAM_BUCKET}/${key}" \
            --metadata "removed-at=${TIMESTAMP},reason=keyword-match,original-bucket=${SOURCE_BUCKET}" \
            --metadata-directive REPLACE \
            --quiet
        
        # delete from source
        aws s3 rm "s3://${SOURCE_BUCKET}/${key}" --quiet
        
        # collect for cloudfront invalidation
        INVALIDATION_PATHS+=("/${key}")
        
        # log
        echo "${TIMESTAMP}|${key}|keyword-match" >> "$LOG_FILE"
    done
    
    # batch invalidate cloudfront (max 3000 paths per invalidation)
    if [[ -n "$CLOUDFRONT_DISTRIBUTION_ID" && ${#INVALIDATION_PATHS[@]} -gt 0 ]]; then
        echo ""
        echo "Invalidating CloudFront cache for ${#INVALIDATION_PATHS[@]} paths..."
        
        # join paths with space for aws cli
        PATHS_JSON=$(printf '%s\n' "${INVALIDATION_PATHS[@]}" | jq -R . | jq -s .)
        
        aws cloudfront create-invalidation \
            --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
            --invalidation-batch "{\"Paths\":{\"Quantity\":${#INVALIDATION_PATHS[@]},\"Items\":${PATHS_JSON}},\"CallerReference\":\"scam-scan-${TIMESTAMP}\"}" \
            --output text
    fi
    
    echo ""
    echo "Done. Quarantined ${#MATCHES[@]} objects."
fi
