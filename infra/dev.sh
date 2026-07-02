#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# ── Auto-decrypt local env if needed ──────────────────────────────────
ENV_FILE="infra/.env.local"
ENC_FILE="infra/.env.local.enc"

if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f "$ENC_FILE" ]]; then
        echo "Decrypting $ENC_FILE → $ENV_FILE ..."
        if ! sops -d --input-type dotenv --output-type dotenv \
             --output "$ENV_FILE" "$ENC_FILE" 2>/dev/null; then
            echo ""
            echo "  Decryption failed. Make sure:"
            echo "    1. sops and age are installed (brew install sops age)"
            echo "    2. Your age key is at ~/.config/sops/age/keys.txt"
            echo "    3. Your age public key is listed in infra/.sops.yaml"
            echo ""
            exit 1
        fi
        echo "Decrypted successfully."
    else
        echo "Error: $ENV_FILE not found and no $ENC_FILE to decrypt."
        echo "Run: pnpm secrets:decrypt:local"
        exit 1
    fi
fi

MODE="${1:-dev}"

case "$MODE" in
    dev)
        COMPOSE_FILE=infra/docker-compose.dev.yml
        echo "Starting development environment (source mounted, fast reload)..."
        ;;
    prod|build)
        COMPOSE_FILE=infra/docker-compose.prod.yml
        echo "Starting production-like environment (built image)..."
        echo "Make sure you've built the image first: docker build -t pubpub:test-build ."
        ;;
    *)
        echo "Usage: $0 [dev|prod]"
        echo "  dev   - Fast development with source mounting (default)"
        echo "  prod  - Production-like testing with built image"
        exit 1
        ;;
esac

trap "docker compose -f $COMPOSE_FILE down" EXIT

# Start all services, but only show logs from app + worker (not db/rabbitmq noise)
docker compose -f "$COMPOSE_FILE" up --build --attach app --attach worker --attach pubstash
