# pubstash

In-repo HTML→PDF conversion service using [Playwright](https://playwright.dev/) + [paged.js](https://pagedjs.org/).

Replaces the standalone [pubpub/pubstash](https://github.com/pubpub/pubstash) Fly.io service. Runs as a Docker Swarm service alongside the main PubPub app, with a hard memory cap so it can never starve the rest of the stack.

Zero external framework dependencies — uses Node's built-in `http` module and `playwright-core` (which drives the system-installed Chromium rather than downloading its own).

## How it works

1. On startup, launches **one persistent Chromium** process via Playwright.
2. For each `POST /convert?format=pdf` request containing HTML:
   - Acquires a semaphore slot (default max concurrency: 2).
   - Opens a new browser **page** (not a new browser).
   - Injects the paged.js polyfill, waits for `.pagedjs_pages`.
   - Calls `page.pdf()`, closes the page.
   - Uploads the PDF to S3, returns `{ url }`.
3. Graceful shutdown closes the browser on SIGTERM/SIGINT.

This eliminates the old architecture's OOM pattern: the original pubstash spawned a **new Chromium process** (via `pagedjs-cli → exec()`) for every single request, with no concurrency limit. A burst of requests would launch dozens of Chromium processes simultaneously, each consuming 200–500 MB, instantly exhausting RAM.

## Environment variables

| Variable               | Required | Default            | Description                                       |
|------------------------|----------|--------------------|---------------------------------------------------|
| `AWS_ACCESS_KEY_ID`    | yes      |                    | S3 credentials                                    |
| `AWS_SECRET_ACCESS_KEY`| yes      |                    | S3 credentials                                    |
| `AWS_S3_BUCKET`        | no       | `assets.pubpub.org`| S3 bucket for PDF uploads                         |
| `AWS_S3_REGION`        | no       | `us-east-1`        | S3 region                                         |
| `AWS_S3_ASSET_PROXY`   | no       | `https://{bucket}` | Base URL prefix for returned PDF URLs             |
| `ACCESS_KEY`           | no       |                    | Shared secret for `Authorization` header          |
| `PORT`                 | no       | `8080`             | HTTP listen port                                  |
| `MAX_CONCURRENCY`      | no       | `2`                | Max simultaneous PDF renders                      |
| `CONVERT_BODY_LIMIT`   | no       | `50mb`             | Max request body size                             |
| `PAGE_TIMEOUT_MS`      | no       | `120000`           | Per-page rendering timeout (ms)                   |

## Local development

```bash
# playwright-core is already in root package.json; just ensure system Chrome is available
pnpm install
```

Test with:

```bash
curl -X POST 'http://localhost:8080/convert?format=pdf' \
  -H 'Content-Type: text/plain' \
  -d '<html><body><h1>Hello PDF</h1></body></html>'
```

## Docker / Swarm

The service is defined in `infra/stack.yml` as the `pubstash` service. It builds from the same PubPub Docker image (which includes Chromium via the Aptfile) and is compiled via the shared `tsconfig.server.json`:

```yaml
pubstash:
    image: ghcr.io/knowledgefutures/pubpub:${IMAGE_TAG}
    command: ['node', 'dist/server/pubstash/server.js']
    deploy:
        resources:
            limits:
                memory: 2G
```

The main PubPub export code reaches it at `http://pubstash:8080/convert` over the internal Docker overlay network.
