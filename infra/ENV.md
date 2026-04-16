# Environment Variables

All environment variables used by PubPub, with types, defaults, and descriptions.

> Auto-generated from `server/env.ts` — do not edit manually.
> Run `npx tsx tools/generateEnvDocs.ts` to regenerate.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | `"production"` \| `"development"` \| `"test"` | No | development | Node environment |
| `PORT` | number | No | 9876 | HTTP server port |
| `PUBPUB_PRODUCTION` | boolean | No | `false` | Treat this instance as the production PubPub deployment |
| `IS_DUQDUQ` | boolean | No | `false` | Treat this instance as the DuqDuq staging deployment |
| `IS_QUBQUB` | boolean | No | `false` | Treat this instance as the QubQub deployment |
| `HEROKU_SLUG_COMMIT` | string | No | — | Git commit hash set by Heroku |
| `PUBPUB_LOCAL_COMMUNITY` | string | No | — | Slug of the community to proxy in local dev (e.g. "stanford-jblp") |
| `FORCE_BASE_PUBPUB` | boolean | No | `false` | Force the base PubPub site in development/QubQub mode |
| `PUBPUB_READ_ONLY` | boolean | No | `false` | Enable read-only mode, disabling all mutations |
| `DISABLE_SSL_REDIRECT` | boolean | No | `false` | Disable automatic HTTP → HTTPS redirect |
| `DATABASE_URL` | string | **Yes** | — | Primary PostgreSQL connection URL |
| `DATABASE_READ_REPLICA_1_URL` | string | No | — | PostgreSQL read-replica 1 URL |
| `DATABASE_READ_REPLICA_2_URL` | string | No | — | PostgreSQL read-replica 2 URL |
| `SEQUELIZE_MAX_CONNECTIONS` | number | No | — | Max DB pool connections (default: 20 for server, 5 for workers) |
| `SEQUELIZE_IDLE_TIMEOUT` | number | No | — | DB pool idle timeout in ms (default: 60000) |
| `SEQUELIZE_ACQUIRE_TIMEOUT` | number | No | — | DB pool acquire timeout in ms (default: 10000) |
| `SEQUELIZE_MAX_USES` | number | No | — | Max times a DB connection may be reused (default: Infinity) |
| `REQUEST_TIMEOUT_MS` | number | No | 30000 | Request abort timeout in ms |
| `JWT_SIGNING_SECRET` | string | **Yes** | — | Secret used to sign JWT tokens |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | string | **Yes** | — | Base64-encoded Firebase service-account JSON |
| `FIREBASE_TEST_DB_URL` | string | No | — | Firebase Realtime Database URL for test env |
| `AWS_ACCESS_KEY_ID` | string | **Yes** | — | AWS access key for S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | string | **Yes** | — | AWS secret key for S3 uploads |
| `AWS_BACKUP_ACCESS_KEY_ID` | string | No | — | AWS access key for backup operations |
| `AWS_BACKUP_SECRET_ACCESS_KEY` | string | No | — | AWS secret key for backup operations |
| `S3_BACKUP_ENDPOINT` | string | No | — | S3-compatible endpoint for backups |
| `S3_BACKUP_ACCESS_KEY` | string | No | — | S3 backup access key (if different from AWS) |
| `S3_BACKUP_SECRET_KEY` | string | No | — | S3 backup secret key (if different from AWS) |
| `S3_BACKUP_BUCKET` | string | No | — | S3 bucket name for backups |
| `S3_BACKUP_KEY_PREFIX` | string | No | pg-backups | Key prefix for backup objects |
| `SMTP_HOST` | string | **Yes** | — | SMTP server hostname (e.g. email-smtp.us-east-1.amazonaws.com) |
| `SMTP_PORT` | number | No | 587 | SMTP server port (587 for STARTTLS, 465 for TLS) |
| `SMTP_USER` | string | **Yes** | — | SMTP authentication username |
| `SMTP_PASS` | string | **Yes** | — | SMTP authentication password |
| `MAILCHIMP_API_KEY` | string | No | — | Mailchimp API key for mailing lists |
| `ALTCHA_HMAC_KEY` | string | **Yes** | — | HMAC key for ALTCHA proof-of-work captcha |
| `BYPASS_CAPTCHA` | boolean | No | `false` | Bypass captcha checks (dev/test only) |
| `AES_ENCRYPTION_KEY` | string | **Yes** | — | AES-256 key for encrypting deposit credentials |
| `DOI_LOGIN_ID` | string | No | — | CrossRef DOI deposit login ID |
| `DOI_LOGIN_PASSWORD` | string | No | — | CrossRef DOI deposit login password |
| `DOI_SUBMISSION_URL` | string | No | — | CrossRef DOI deposit endpoint URL |
| `DATACITE_DEPOSIT_URL` | string | No | — | DataCite DOI deposit endpoint URL |
| `CLOUDAMQP_URL` | string | No | — | CloudAMQP (RabbitMQ) connection URL |
| `ZOTERO_CLIENT_KEY` | string | No | — | Zotero OAuth1 consumer key |
| `ZOTERO_CLIENT_SECRET` | string | No | — | Zotero OAuth1 consumer secret |
| `FASTLY_SERVICE_ID_PROD` | string | No | — | Fastly service ID for production |
| `FASTLY_PURGE_TOKEN_PROD` | string | No | — | Fastly purge token for production |
| `FASTLY_SERVICE_ID_DUQDUQ` | string | No | — | Fastly service ID for DuqDuq |
| `FASTLY_PURGE_TOKEN_DUQDUQ` | string | No | — | Fastly purge token for DuqDuq |
| `PURGE_TOKEN` | string | No | — | Legacy Fastly purge token |
| `SLACK_WEBHOOK_URL` | string | No | — | Slack incoming webhook URL for notifications |
| `STITCH_WEBHOOK_URL` | string | No | — | MongoDB Stitch webhook URL for analytics |
| `SENTRY_AUTH_TOKEN` | string | No | — | Sentry auth token (build-time only) |
| `SENTRY_ORG` | string | No | — | Sentry organization slug |
| `BLOCKLIST_IP_ADDRESSES` | string | No | — | Comma-separated list of IP addresses to block |
| `LARGE_COMMUNITY_SLUGS` | string | No | — | Comma-separated list of large community slugs for optimized queries |
| `NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES` | number | No | — | Minutes after account creation during which link-comments are flagged |
| `EXTRA_SUSPICIOUS_KEYWORDS` | string | No | — | Comma-separated extra keywords to flag uploads as suspicious |
| `BACKUPS_SECRET` | string | No | — | GPG passphrase for encrypting backups |
| `DEBUG_LOG` | string | No | — | Enable verbose debug logging |
| `WORKER` | boolean | No | `false` | Set to true when running as a standalone worker process |
| `DEFAULT_QUEUE_TASK_PRIORITY` | number | No | — | Default priority for worker queue tasks |
| `PUBPUB_LOCAL_TASK_QUEUE` | string | No | — | Custom task queue name for local development |
| `INTEGRATION_TESTING` | boolean | No | `false` | Signals that integration tests are running |
| `TEST_FASTLY_PURGE` | boolean | No | `false` | Enable Fastly purge calls during tests |
| `USE_LOCAL_DB` | boolean | No | `false` | Force use of local PostgreSQL in development |

## Required Variables Checklist

These must be set for the server to start:

- [ ] `DATABASE_URL` — Primary PostgreSQL connection URL
- [ ] `JWT_SIGNING_SECRET` — Secret used to sign JWT tokens
- [ ] `FIREBASE_SERVICE_ACCOUNT_BASE64` — Base64-encoded Firebase service-account JSON
- [ ] `AWS_ACCESS_KEY_ID` — AWS access key for S3 uploads
- [ ] `AWS_SECRET_ACCESS_KEY` — AWS secret key for S3 uploads
- [ ] `SMTP_HOST` — SMTP server hostname
- [ ] `SMTP_USER` — SMTP authentication username
- [ ] `SMTP_PASS` — SMTP authentication password
- [ ] `ALTCHA_HMAC_KEY` — HMAC key for ALTCHA proof-of-work captcha
- [ ] `AES_ENCRYPTION_KEY` — AES-256 key for encrypting deposit credentials
