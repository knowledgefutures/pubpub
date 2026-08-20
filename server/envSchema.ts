import { z } from 'zod';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Coerce "true"/"false"/undefined → boolean */
const booleanish = z
	.union([z.boolean(), z.string()])
	.optional()
	.transform((v) => v === true || v === 'true');

/** Coerce string → number (or leave undefined) */
const optionalInt = z.coerce.number().int().optional();

// ─── Schema ─────────────────────────────────────────────────────────────────

export const envSchema = z.object({
	// ── Node / Runtime ───────────────────────────────────────────────────
	NODE_ENV: z
		.enum(['production', 'development', 'test'])
		.default('development')
		.describe('Node environment'),
	PORT: z.coerce.number().int().default(9876).describe('HTTP server port'),
	APP_COMMIT: z.string().optional().describe('Git commit hash for this deployed build'),

	// ── PubPub Environment ──────────────────────────────────────────────
	PUBPUB_PRODUCTION: booleanish.describe(
		'Treat this instance as the production PubPub deployment',
	),
	IS_DUQDUQ: booleanish.describe('Treat this instance as the DuqDuq staging deployment'),
	IS_QUBQUB: booleanish.describe('Treat this instance as the QubQub deployment'),
	PUBPUB_LOCAL_COMMUNITY: z
		.string()
		.optional()
		.describe('Slug of the community to proxy in local dev (e.g. "stanford-jblp")'),
	// .transform((arg) => {
	// 	if (arg) {
	// 		return arg;
	// 	}

	// 	if (process.env.NODE_ENV === 'development') {
	// 		return 'demo';
	// 	}
	// 	return undefined;
	// }),
	FORCE_BASE_PUBPUB: booleanish.describe('Force the base PubPub site in development/QubQub mode'),
	PUBPUB_READ_ONLY: booleanish.describe('Enable read-only mode, disabling all mutations'),
	DISABLE_SSL_REDIRECT: booleanish.describe('Disable automatic HTTP → HTTPS redirect'),

	// ── Database ─────────────────────────────────────────────────────────
	DATABASE_URL: z.string().url().describe('Primary PostgreSQL connection URL'),

	// ── Sequelize Pool ──────────────────────────────────────────────────
	SEQUELIZE_MAX_CONNECTIONS: optionalInt.describe(
		'Max DB pool connections (default: 20 for server, 5 for workers)',
	),
	SEQUELIZE_IDLE_TIMEOUT: optionalInt.describe('DB pool idle timeout in ms (default: 60000)'),
	SEQUELIZE_ACQUIRE_TIMEOUT: optionalInt.describe(
		'DB pool acquire timeout in ms (default: 10000)',
	),
	SEQUELIZE_MAX_USES: optionalInt.describe(
		'Max times a DB connection may be reused (default: Infinity)',
	),

	// ── Server ───────────────────────────────────────────────────────────
	REQUEST_TIMEOUT_MS: z.coerce
		.number()
		.int()
		.default(30_000)
		.describe('Request abort timeout in ms'),

	// ── Auth / Signing ──────────────────────────────────────────────────
	JWT_SIGNING_SECRET: z.string().min(1).describe('Secret used to sign JWT tokens'),

	// ── Firebase ─────────────────────────────────────────────────────────
	FIREBASE_SERVICE_ACCOUNT_BASE64: z
		.string()
		.min(1)
		.describe('Base64-encoded Firebase service-account JSON'),
	FIREBASE_TEST_DB_URL: z
		.string()
		.url()
		.optional()
		.describe('Firebase Realtime Database URL for test env'),

	// ── S3 ─────────────────────────────────────────────────────────
	AWS_ACCESS_KEY_ID: z.string().min(1).describe('AWS access key for S3 uploads'),
	AWS_SECRET_ACCESS_KEY: z.string().min(1).describe('AWS secret key for S3 uploads'),

	// ── Backup ─────────────────────────────────────────────────────────
	AWS_BACKUP_ACCESS_KEY_ID: z.string().describe('AWS access key for backup operations'),
	AWS_BACKUP_SECRET_ACCESS_KEY: z.string().describe('AWS secret key for backup operations'),

	// ── S3 Backup, again? ───────────────────────────────────────────────
	S3_BACKUP_ENDPOINT: z.string().describe('S3-compatible endpoint for backups'),
	S3_BACKUP_ACCESS_KEY: z.string().describe('S3 backup access key (if different from AWS)'),
	S3_BACKUP_SECRET_KEY: z.string().describe('S3 backup secret key (if different from AWS)'),
	S3_BACKUP_BUCKET: z.string().optional().describe('S3 bucket name for backups'),
	S3_BACKUP_KEY_PREFIX: z
		.string()
		.default('pg-backups')
		.describe('Key prefix for backup objects'),

	// ── Email ────────────────────────────────────────────────────────────
	SMTP_HOST: z
		.string()
		.min(1)
		.describe('SMTP server hostname (e.g. email-smtp.us-east-1.amazonaws.com)'),
	SMTP_PORT: z.coerce
		.number()
		.default(587)
		.describe('SMTP server port (587 for STARTTLS, 465 for TLS)'),
	SMTP_USER: z.string().min(1).describe('SMTP authentication username'),
	SMTP_PASS: z.string().min(1).describe('SMTP authentication password'),
	MAILCHIMP_API_KEY: z.string().optional().describe('Mailchimp API key for mailing lists'),

	// ── Captcha (ALTCHA) ────────────────────────────────────────────────
	ALTCHA_HMAC_KEY: z.string().min(1).describe('HMAC key for ALTCHA proof-of-work captcha'),
	BYPASS_CAPTCHA: booleanish.describe('Bypass captcha checks (dev/test only)'),

	// ── Encryption ──────────────────────────────────────────────────────
	AES_ENCRYPTION_KEY: z
		.string()
		.min(1)
		.describe('AES-256 key for encrypting deposit credentials'),

	// ── DOI / CrossRef ──────────────────────────────────────────────────
	DOI_LOGIN_ID: z.string().describe('CrossRef DOI deposit login ID'),
	DOI_LOGIN_PASSWORD: z.string().describe('CrossRef DOI deposit login password'),
	DOI_SUBMISSION_URL: z.string().url().describe('CrossRef DOI deposit endpoint URL'),

	// ── DataCite ─────────────────────────────────────────────────────────
	DATACITE_DEPOSIT_URL: z.string().url().describe('DataCite DOI deposit endpoint URL'),

	// ── Doily (Crossref deposit broker) ─────────────────────────────────
	DOILY_URL: z
		.string()
		.url()
		.optional()
		.describe('Doily API base URL — with DOILY_API_TOKEN, enables the doilyDeposits flag path'),
	DOILY_API_TOKEN: z
		.string()
		.optional()
		.describe('Doily app token (doily_sk_…) for the pubpub app'),
	DOILY_WEBHOOK_SECRET: z
		.string()
		.optional()
		.describe(
			'Doily webhook subscription secret (whsec_…), the HMAC key for POST /api/doily/webhook',
		),

	// ── Message Queues ──────────────────────────────────────────────────
	CLOUDAMQP_URL: z.string().describe('CloudAMQP (RabbitMQ) connection URL'),

	// ── Zotero ──────────────────────────────────────────────────────────
	ZOTERO_CLIENT_KEY: z.string().describe('Zotero OAuth1 consumer key'),
	ZOTERO_CLIENT_SECRET: z.string().describe('Zotero OAuth1 consumer secret'),

	// ── CDN / Fastly ────────────────────────────────────────────────────
	FASTLY_SERVICE_ID: z.string().describe('Fastly service ID'),
	FASTLY_PURGE_TOKEN: z.string().describe('Fastly purge token'),

	// ── Webhooks / Integrations ─────────────────────────────────────────
	SLACK_WEBHOOK_URL: z.string().describe('Slack incoming webhook URL for notifications'),

	// ── Observability ───────────────────────────────────────────────────
	SENTRY_AUTH_TOKEN: z.string().describe('Sentry auth token (build-time only)'),
	SENTRY_ORG: z.string().describe('Sentry organization slug'),

	// ── Analytics ───────────────────────────────────────────────────────
	CLOUDFLARE_ANALYTICS_API_TOKEN: z
		.string()
		.optional()
		.describe('Analytics token with read permissions fo Cloudflare GraphQL'),
	CLOUDFLARE_ZONE_TAG: z.string().optional().describe('Zone ID of the domain used'),

	// ── Cloudflare Custom Hostnames ─────────────────────────────────────
	CLOUDFLARE_CUSTOM_HOSTNAME_API_TOKEN: z
		.string()
		.optional()
		.describe('Cloudflare API token with SSL & Hostnames:Edit permission'),

	// ── Spam / Security ─────────────────────────────────────────────────
	BLOCKLIST_IP_ADDRESSES: z
		.string()
		.optional()
		.describe('Comma-separated list of IP addresses to block'),
	LARGE_COMMUNITY_SLUGS: z
		.string()
		.optional()
		.describe('Comma-separated list of large community slugs for optimized queries'),
	NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES: z.coerce
		.number()
		.int()
		.optional()
		.describe('Minutes after account creation during which link-comments are flagged'),
	EXTRA_SUSPICIOUS_KEYWORDS: z
		.string()
		.optional()
		.describe('Comma-separated extra keywords to flag uploads as suspicious'),

	// ── Underlay ────────────────────────────────────────────────────────
	UNDERLAY_API_BASE_URL: z
		.string()
		.url()
		.optional()
		.describe('Base URL for the Underlay API (defaults to https://underlay.org/api)'),

	// ── Backup / Misc ───────────────────────────────────────────────────
	BACKUPS_SECRET: z.string().optional().describe('GPG passphrase for encrypting backups'),
	DEBUG_LOG: z.string().optional().describe('Enable verbose debug logging'),

	// ── Worker ───────────────────────────────────────────────────────────
	WORKER: booleanish.describe('Set to true when running as a standalone worker process'),
	WORKER_MAX_OLD_SPACE_MB: z.coerce
		.number()
		.int()
		.positive()
		.optional()
		.describe(
			'Heap ceiling (MB) for each worker thread. Unset means Node derives it from host memory, ' +
				'which makes OOM behaviour differ between machines. Set it to make failures reproducible.',
		),
	DEFAULT_QUEUE_TASK_PRIORITY: z.coerce
		.number()
		.int()
		.optional()
		.describe('Default priority for worker queue tasks'),
	PUBPUB_LOCAL_TASK_QUEUE: z
		.string()
		.optional()
		.describe('Custom task queue name for local development'),

	// ── Content Search ──────────────────────────────────────────────────
	CONTENT_SEARCH_TERMS: z
		.string()
		.optional()
		.describe(
			'JSON array of search terms for the "By Content" tab. Each element is a string or [name, ...aliases]',
		),

	// ── Session ─────────────────────────────────────────────────────────
	SESSION_SECRET: z.string().min(1).describe('Secret for signing session cookies'),

	// ── Testing ──────────────────────────────────────────────────────────
	INTEGRATION_TESTING: booleanish.describe('Signals that integration tests are running'),
	TEST_FASTLY_PURGE: booleanish.describe('Enable Fastly purge calls during tests'),
	USE_LOCAL_DB: booleanish.describe('Force use of local PostgreSQL in development'),
});

export type Env = z.infer<typeof envSchema>;
