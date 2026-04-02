#!/usr/bin/env bash
#
# Warns before encrypting secrets, showing who last edited the encrypted file.
# Usage: scripts/confirm-encrypt.sh [dev]

set -euo pipefail

if [ "${1:-}" = "dev" ]; then
  ENC_FILE="infra/.env.dev.enc"
  PLAIN_FILE="infra/.env.dev"
  LABEL="dev"
else
  ENC_FILE="infra/.env.enc"
  PLAIN_FILE="infra/.env"
  LABEL="production"
fi

echo ""
echo "⚠️  You are about to encrypt $LABEL secrets."
echo "   Make sure your local $PLAIN_FILE is up to date with the latest $ENC_FILE."
echo ""

# Show last git commit that touched the encrypted file
if git log -1 --format="   Last edit to $ENC_FILE:%n     Author:  %an <%ae>%n     Date:    %ad%n     Message: %s" --date=relative -- "$ENC_FILE" 2>/dev/null; then
  echo ""
else
  echo "   (no git history found for $ENC_FILE)"
  echo ""
fi

read -r -p "Continue with encryption? [y/N] " response
case "$response" in
  [yY])
    echo ""
    ;;
  *)
    echo "Aborted."
    exit 1
    ;;
esac
