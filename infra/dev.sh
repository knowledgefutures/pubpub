#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

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

docker compose -f "$COMPOSE_FILE" up --build
