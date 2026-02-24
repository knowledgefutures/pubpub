# ---- Base image ----
FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Install system packages listed in Aptfile (ignore comments/blank lines)
COPY Aptfile /tmp/Aptfile
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
 && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/pgdg.gpg \
 && echo "deb http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
 && apt-get update \
 && awk '!/^\s*#/ && !/^\s*$/' /tmp/Aptfile \
      | xargs -r apt-get install -y --no-install-recommends \
 # Pick correct pandoc .deb for current architecture (amd64 / arm64)
 && ARCH="$(dpkg --print-architecture)" \
 && if [ "$ARCH" = "amd64" ]; then \
        PANDOC_DEB="https://github.com/jgm/pandoc/releases/download/2.19.2/pandoc-2.19.2-1-amd64.deb"; \
    elif [ "$ARCH" = "arm64" ]; then \
        PANDOC_DEB="https://github.com/jgm/pandoc/releases/download/2.19.2/pandoc-2.19.2-1-arm64.deb"; \
    else \
        echo "Unsupported architecture for pandoc: $ARCH" && exit 1; \
    fi \
 # Download and install Pandoc 2.19.2
 && curl -L -o /tmp/pandoc.deb "$PANDOC_DEB" \
 && dpkg -i /tmp/pandoc.deb || (apt-get -fy install && dpkg -i /tmp/pandoc.deb) \
 && rm /tmp/pandoc.deb \
 # Keep curl for health checks and clean apt cache
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

# ---- Production dependencies ----
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ---- Builder stage ----
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build-prod

# ---- Development stage ----
FROM base AS dev

ENV NODE_ENV=development
ENV PORT=3000

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "start"]

# ---- Production runtime stage ----
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=builder /app/init.js /app/init.js
# otherwise export fails
COPY --from=builder /app/client/components/Editor/styles /app/client/components/Editor/styles
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/static /app/static
COPY --from=builder /app/tools /app/tools
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml

EXPOSE 3000

CMD ["pnpm", "run", "api-prod"]
