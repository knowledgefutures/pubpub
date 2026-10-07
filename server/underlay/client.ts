import { hashSchema, jcs } from './hash';
import {
	buildManifest,
	type JsonSchema,
	type ManifestEntry,
	type UnderlayFile,
	type UnderlayPushPayload,
	type UnderlayRecord,
} from './mapping';

/**
 * Minimal client for the Underlay delta push protocol.
 * @see https://www.underlay.org/llms.txt §"Writing Data: The Push Flow"
 *
 * A push reads the head version's manifest, diffs our full record set against it, and uploads only
 * the records that changed plus the (type, id) pairs that went away. The server's manifest is the
 * source of truth for what it holds; PubPub's own push cache only decides what to re-render.
 *
 * Framework-free so it can be driven from a worker. Uses global fetch + AbortController; no
 * external HTTP dependency.
 */

// The apex domain 301s to www. fetch follows that by turning a POST into a GET and dropping the
// Authorization header across origins, so the default must be the www host itself.
const DEFAULT_BASE_URL = 'https://www.underlay.org/api';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 4;

/** Manifest page size: the server's maximum (each entry is ~120 bytes). */
const MANIFEST_PAGE_LIMIT = 25_000;

/** Fallbacks for a session whose `limits` omit a batch limit; the server's values win. */
const DEFAULT_BATCH_LINES = 10_000;
const DEFAULT_BATCH_BYTES = 16 * 1024 * 1024;

/**
 * Largest file the plain `PUT …/files/:hash` accepts. Larger files go through a presigned upload.
 * Files are streamed during mapping, before any session reports `limits.file_bytes`, so this is
 * fixed here; a 413 from the plain PUT also falls back to the presigned upload.
 */
const SMALL_UPLOAD_BYTES = 32 * 1024 * 1024;
/** A presigned PUT of a large export is one long request; give it far more than the API timeout. */
const LARGE_UPLOAD_TIMEOUT_MS = 30 * 60 * 1000;
/** How long to wait for the server to verify a presigned upload's hash. */
const UPLOAD_VERIFY_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Async-commit polling. Underlay commits a large push in the background — minutes of work, far past
 * REQUEST_TIMEOUT_MS. Holding the request open would abort and then *retry* that work, so we ask for
 * an async commit and poll the session instead.
 */
const COMMIT_POLL_INITIAL_MS = 2_000;
const COMMIT_POLL_MAX_MS = 15_000;
/** Generous: the worker's own task timeout (4h) is the real backstop. */
const COMMIT_POLL_TIMEOUT_MS = 60 * 60 * 1000;
/** How often to log that a commit is still running, so a long push isn't silent in the worker logs. */
const COMMIT_LOG_INTERVAL_MS = 30_000;

export type PushClientOptions = {
	apiKey: string;
	owner: string;
	slug: string;
	baseUrl?: string;
	/** Identifies the pushing app + actor in the commit metadata. */
	appId?: string;
	actorId?: string;
	/** Async-commit (and upload-verify) poll timing. Overridable so tests don't wait real seconds. */
	pollIntervalMs?: number;
	pollTimeoutMs?: number;
};

export type PushChanges = { added: number; updated: number; removed: number };

export type PushResult =
	| { status: 'noop'; reason: string }
	| {
			status: 'committed';
			semver: string;
			hash: string;
			recordCount: number;
			fileCount: number;
			changes?: PushChanges;
	  };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class UnderlayPushError extends Error {
	constructor(
		message: string,
		public readonly statusCode?: number,
		public readonly detail?: unknown,
		/**
		 * The push can recover by starting over against the current head: a version conflict
		 * (someone published after we read the manifest), or a commit refused for a cause we've
		 * since fixed (missing files, now uploaded). A refused commit leaves its session `failed`,
		 * and only an `open` session accepts a commit, so recovery always means a new session.
		 */
		public readonly retriable = false,
	) {
		super(message);
		this.name = 'UnderlayPushError';
	}
}

export type UnderlayAccount = { slug: string; name: string };
export type UnderlayCollectionInfo = { slug: string; name: string };

/**
 * Human-readable error string including the HTTP status and response detail an UnderlayPushError
 * carries. Use this (not `error.message` alone) whenever surfacing a push failure to logs or the
 * stored `lastPushError` — the detail is usually the part that explains WHY the server refused.
 */
export const formatUnderlayError = (error: unknown): string => {
	if (error instanceof UnderlayPushError) {
		const parts = [error.message];
		if (error.statusCode) {
			parts.push(`(HTTP ${error.statusCode})`);
		}
		if (error.detail) {
			const detail =
				typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
			parts.push(`— ${detail.slice(0, 500)}`);
		}
		return parts.join(' ');
	}
	return error instanceof Error ? error.message : String(error);
};

/** `/accounts/me` lists the caller's organizations as `orgs`. */
type MeBody = { orgs?: { slug: string; name?: string | null }[] };

/** One authenticated fetch, parsed as JSON, with every failure mode reported instead of thrown. */
const fetchJson = async (
	url: string,
	apiKey: string,
): Promise<
	| { kind: 'network'; error: string }
	| { kind: 'http'; status: number; bodyText: string }
	| { kind: 'not-json'; status: number; bodyText: string }
	| { kind: 'json'; status: number; body: unknown }
> => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		const response = await fetch(url, {
			headers: { Authorization: `Bearer ${apiKey}` },
			signal: controller.signal,
		});
		const text = await response.text();
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			return { kind: 'not-json', status: response.status, bodyText: text.slice(0, 200) };
		}
		if (!response.ok) {
			return { kind: 'http', status: response.status, bodyText: text.slice(0, 200) };
		}
		return { kind: 'json', status: response.status, body: parsed };
	} catch (err) {
		return { kind: 'network', error: err instanceof Error ? err.message : String(err) };
	} finally {
		clearTimeout(timeout);
	}
};

export type ConnectionCheck = {
	ok: boolean;
	/** One-line summary suitable for the UI. */
	message: string;
	/** Step-by-step results, suitable for logs and the UI's detail view. */
	steps: { name: string; ok: boolean; message: string }[];
	/** The collection doesn't exist yet; it will be created on the first push. Not a failure. */
	collectionMissing?: boolean;
};

/**
 * Probe the Underlay API with just an API key. Returns the accounts (orgs) the key has access to,
 * and optionally the collections within one account. Runs outside an UnderlayClient instance because
 * we don't yet know the owner/slug.
 */
export async function probeUnderlay(
	apiKey: string,
	opts?: { baseUrl?: string; owner?: string },
): Promise<{ accounts: UnderlayAccount[]; collections: UnderlayCollectionInfo[] }> {
	const baseUrl = (opts?.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
	const headers = { Authorization: `Bearer ${apiKey}` };
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		let meResp: Response;
		try {
			meResp = await fetch(`${baseUrl}/accounts/me`, {
				headers,
				signal: controller.signal,
			});
		} catch (err) {
			throw new UnderlayPushError(
				`Could not reach the Underlay API at ${baseUrl} — check UNDERLAY_API_BASE_URL (${err instanceof Error ? err.message : String(err)})`,
			);
		}
		const meText = await meResp.text();
		let me: MeBody;
		try {
			me = JSON.parse(meText);
		} catch {
			throw new UnderlayPushError(
				`${baseUrl}/accounts/me did not return JSON (HTTP ${meResp.status}) — this does not look like an Underlay API. Check UNDERLAY_API_BASE_URL.`,
				meResp.status,
			);
		}
		if (meResp.status === 401 || meResp.status === 403) {
			throw new UnderlayPushError(
				`The Underlay API at ${baseUrl} rejected the API key (HTTP ${meResp.status})`,
				meResp.status,
			);
		}
		if (!meResp.ok) {
			throw new UnderlayPushError(
				`The Underlay API at ${baseUrl} returned HTTP ${meResp.status} for /accounts/me`,
				meResp.status,
				meText.slice(0, 200),
			);
		}
		const accounts: UnderlayAccount[] = (me.orgs ?? []).map((a) => ({
			slug: a.slug,
			name: a.name || a.slug,
		}));

		let collections: UnderlayCollectionInfo[] = [];
		if (opts?.owner) {
			clearTimeout(timeout);
			const colController = new AbortController();
			const colTimeout = setTimeout(() => colController.abort(), REQUEST_TIMEOUT_MS);
			try {
				const colResp = await fetch(
					`${baseUrl}/accounts/${encodeURIComponent(opts.owner)}/collections`,
					{ headers, signal: colController.signal },
				);
				if (colResp.ok) {
					const body = (await colResp.json()) as {
						slug: string;
						name: string;
					}[];
					collections = (Array.isArray(body) ? body : []).map((c) => ({
						slug: c.slug,
						name: c.name || c.slug,
					}));
				}
			} finally {
				clearTimeout(colTimeout);
			}
		}
		return { accounts, collections };
	} finally {
		clearTimeout(timeout);
	}
}

/** The head version as a delta push needs it: what the server holds, by (type, id). */
export type UnderlayHead = {
	semver: string;
	metadata: Record<string, unknown> | null;
	/** type → schema hash (bare hex). */
	schemaHashes: Record<string, string>;
	records: Map<string, { id: string; type: string; hash: string; private: boolean }>;
};

export type PushPlan = {
	/** Our entries the head lacks, holds with a different hash, or holds in the other access set. */
	upserts: ManifestEntry[];
	/** Pairs the head holds that we no longer have, limited to types we still push. */
	deletes: { type: string; id: string }[];
	schemasChanged: boolean;
};

const recordKey = (type: string, id: string) => `${type}\u0000${id}`;
const bareHash = (hash: string) => hash.replace(/^sha256:/, '');

/**
 * Diff our full record set against the head. A delete is only sent for a type that stays in our
 * schema set: dropping a type removes its records with it, and the server refuses a delete line
 * whose type isn't in the session's type set.
 */
export const diffAgainstHead = (
	manifest: ManifestEntry[],
	schemas: Record<string, JsonSchema>,
	schemaHash: (schema: JsonSchema) => string,
	head: UnderlayHead | null,
): PushPlan => {
	const upserts: ManifestEntry[] = [];
	const ours = new Set<string>();
	for (const entry of manifest) {
		const key = recordKey(entry.type, entry.id);
		ours.add(key);
		const theirs = head?.records.get(key);
		if (!theirs || theirs.hash !== entry.hash || theirs.private !== Boolean(entry.private)) {
			upserts.push(entry);
		}
	}
	const deletes: PushPlan['deletes'] = [];
	for (const [key, theirs] of head?.records ?? []) {
		if (!ours.has(key) && theirs.type in schemas) {
			deletes.push({ type: theirs.type, id: theirs.id });
		}
	}
	const theirSchemas = head?.schemaHashes ?? {};
	const schemasChanged =
		!head ||
		Object.keys(theirSchemas).length !== Object.keys(schemas).length ||
		Object.entries(schemas).some(([type, schema]) => theirSchemas[type] !== schemaHash(schema));
	return { upserts, deletes, schemasChanged };
};

/**
 * The fields of `patch` whose value differs from the head's metadata, or null if none do. A null
 * value means "absent" on either side, so clearing a readme that was never set is not a change.
 */
export const metadataChanges = (
	patch: Record<string, unknown> | undefined,
	headMetadata: Record<string, unknown> | null,
): Record<string, unknown> | null => {
	if (!patch) {
		return null;
	}
	const changed: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(patch)) {
		if (jcs(value ?? null) !== jcs(headMetadata?.[key] ?? null)) {
			changed[key] = value ?? null;
		}
	}
	return Object.keys(changed).length > 0 ? changed : null;
};

type SessionLimits = { batch_lines?: number; batch_bytes?: number };

/** A commit refusal, as the synchronous response body or a failed session's `error`. */
type CommitErrorBody = {
	error?: string;
	statusCode?: number;
	currentVersion?: string | null;
	filesNeeded?: string[];
	hash?: string;
};

export class UnderlayClient {
	private readonly baseUrl: string;
	private readonly apiKey: string;
	private readonly owner: string;
	private readonly slug: string;
	private readonly appId: string;
	private readonly actorId: string;
	private readonly pollIntervalMs: number;
	private readonly pollTimeoutMs: number;

	constructor(options: PushClientOptions) {
		this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
		this.apiKey = options.apiKey;
		this.owner = options.owner;
		this.slug = options.slug;
		this.appId = options.appId ?? 'pubpub';
		this.actorId = options.actorId ?? 'pubpub:push-to-underlay';
		this.pollIntervalMs = options.pollIntervalMs ?? COMMIT_POLL_INITIAL_MS;
		this.pollTimeoutMs = options.pollTimeoutMs ?? COMMIT_POLL_TIMEOUT_MS;
	}

	private collectionPath() {
		return `${this.baseUrl}/collections/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.slug)}`;
	}

	/** fetch with auth, timeout, and retry/backoff on 429 + 5xx. */
	private async request(
		url: string,
		init: RequestInit & { rawBody?: Buffer | string } = {},
		{
			auth = true,
			timeoutMs = REQUEST_TIMEOUT_MS,
		}: { auth?: boolean; timeoutMs?: number } = {},
	): Promise<Response> {
		const { rawBody, ...rest } = init;
		let lastError: unknown;
		for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), timeoutMs);
			try {
				const headers = new Headers(rest.headers);
				if (auth) {
					headers.set('Authorization', `Bearer ${this.apiKey}`);
				}
				// biome-ignore lint/performance/noAwaitInLoops: sequential retry loop, bounded by MAX_RETRIES
				const response = await fetch(url, {
					...rest,
					// Buffer is a valid BodyInit at runtime; cast to satisfy the DOM fetch typings.
					body: (rawBody ?? rest.body) as BodyInit | null | undefined,
					headers,
					signal: controller.signal,
				});

				if (response.status === 429 || response.status >= 500) {
					const retryAfter = Number(response.headers.get('Retry-After'));
					const delay =
						Number.isFinite(retryAfter) && retryAfter > 0
							? retryAfter * 1000
							: Math.min(8_000, 500 * 2 ** attempt);
					lastError = new UnderlayPushError(
						`Underlay responded ${response.status}`,
						response.status,
					);
					// biome-ignore lint/performance/noAwaitInLoops: intentional backoff
					await sleep(delay);
					continue;
				}
				return response;
			} catch (err) {
				lastError = err;
				// biome-ignore lint/performance/noAwaitInLoops: intentional backoff
				await sleep(Math.min(8_000, 500 * 2 ** attempt));
			} finally {
				clearTimeout(timeout);
			}
		}
		throw new UnderlayPushError(
			`Request to ${url} failed after ${MAX_RETRIES} attempts: ${String(lastError)}`,
		);
	}

	private async json<T>(response: Response): Promise<T> {
		const text = await response.text();
		try {
			return JSON.parse(text) as T;
		} catch {
			throw new UnderlayPushError(`Expected JSON from Underlay, got: ${text.slice(0, 200)}`);
		}
	}

	/** A response body as JSON when it is JSON, else its text (for error detail). */
	private async body(response: Response): Promise<unknown> {
		const text = await response.text();
		try {
			return JSON.parse(text);
		} catch {
			return text.slice(0, 500);
		}
	}

	/**
	 * Read the head version and its full manifest (ids, types and hashes; no bodies). Returns null
	 * when the collection has no versions yet.
	 *
	 * Sent authenticated: Underlay resolves these routes through the caller's access, so an anonymous
	 * request against a PRIVATE collection 404s — indistinguishable from "no versions yet", which
	 * would make every record look new. Authenticated as a member, the manifest also lists the
	 * private set, marked `"private": true`.
	 *
	 * Pages after the first are read at the head's semver rather than `latest`, so a version
	 * published mid-read can't splice two versions into one manifest.
	 */
	async readHead(): Promise<UnderlayHead | null> {
		const latest = await this.request(`${this.collectionPath()}/versions/latest`, {
			method: 'GET',
		});
		if (latest.status === 404) {
			return null;
		}
		if (!latest.ok) {
			throw new UnderlayPushError(
				'Failed to fetch the latest version',
				latest.status,
				await this.body(latest),
			);
		}
		const version = await this.json<{
			semver: string;
			metadata?: Record<string, unknown> | null;
		}>(latest);

		const records: UnderlayHead['records'] = new Map();
		let schemaHashes: Record<string, string> = {};
		let cursor: string | null = null;
		let firstPage = true;
		do {
			const params = new URLSearchParams({ limit: String(MANIFEST_PAGE_LIMIT) });
			if (cursor) {
				params.set('cursor', cursor);
			}
			// biome-ignore lint/performance/noAwaitInLoops: manifest pages are cursor-chained
			const response = await this.request(
				`${this.collectionPath()}/versions/${encodeURIComponent(version.semver)}/manifest?${params}`,
				{ method: 'GET' },
			);
			if (!response.ok) {
				throw new UnderlayPushError(
					`Failed to read the manifest of ${version.semver}`,
					response.status,
					await this.body(response),
				);
			}
			// biome-ignore lint/performance/noAwaitInLoops: manifest pages are cursor-chained
			const page = await this.json<{
				schemas?: Record<string, string>;
				records?: { id: string; type: string; hash: string; private?: boolean }[];
				pagination?: { hasMore?: boolean; nextCursor?: string | null };
			}>(response);
			if (firstPage) {
				schemaHashes = Object.fromEntries(
					Object.entries(page.schemas ?? {}).map(([type, hash]) => [
						type,
						bareHash(hash),
					]),
				);
				firstPage = false;
			}
			for (const r of page.records ?? []) {
				records.set(recordKey(r.type, r.id), {
					id: r.id,
					type: r.type,
					hash: bareHash(r.hash),
					private: r.private === true,
				});
			}
			cursor = page.pagination?.hasMore ? (page.pagination.nextCursor ?? null) : null;
		} while (cursor);

		return {
			semver: version.semver,
			metadata: version.metadata ?? null,
			schemaHashes,
			records,
		};
	}

	/**
	 * Read-only connection diagnostic. Verifies, in order: the base URL actually answers with JSON
	 * (a wrong UNDERLAY_API_BASE_URL pointing at a website returns HTTP 200 HTML for everything —
	 * that must NOT pass), the API key is accepted, the key can see the configured organization, and
	 * whether the collection exists. Unlike ensureCollection this NEVER creates anything, so it is
	 * safe to run from a "Test connection" button and at the start of every push.
	 */
	async verifyConnection(): Promise<ConnectionCheck> {
		const steps: ConnectionCheck['steps'] = [];
		const fail = (message: string): ConnectionCheck => ({ ok: false, message, steps });

		// 1. API reachability + key validity.
		const meUrl = `${this.baseUrl}/accounts/me`;
		const me = await fetchJson(meUrl, this.apiKey);
		if (me.kind === 'network') {
			steps.push({
				name: 'api',
				ok: false,
				message: `Could not reach ${meUrl}: ${me.error}`,
			});
			return fail(
				`The Underlay API is unreachable at ${this.baseUrl} — check UNDERLAY_API_BASE_URL (${me.error}).`,
			);
		}
		if (me.kind === 'not-json') {
			steps.push({
				name: 'api',
				ok: false,
				message: `${meUrl} returned HTTP ${me.status} with a non-JSON body`,
			});
			return fail(
				`${this.baseUrl} did not return JSON for /me — this does not look like an Underlay API. Check UNDERLAY_API_BASE_URL.`,
			);
		}
		if (me.kind === 'http') {
			steps.push({
				name: 'api',
				ok: false,
				message: `${meUrl} returned HTTP ${me.status}: ${me.bodyText}`,
			});
			return fail(
				me.status === 401 || me.status === 403
					? `The Underlay API rejected the API key (HTTP ${me.status}).`
					: `The Underlay API returned HTTP ${me.status} for /me.`,
			);
		}
		steps.push({
			name: 'api',
			ok: true,
			message: `Reached the Underlay API at ${this.baseUrl}; the API key was accepted.`,
		});

		// 2. Organization access.
		const accounts = ((me.body as MeBody)?.orgs ?? []).map((a) => a.slug);
		if (accounts.length > 0 && !accounts.includes(this.owner)) {
			steps.push({
				name: 'organization',
				ok: false,
				message: `The API key has no access to "${this.owner}". Available: ${accounts.join(', ')}`,
			});
			return fail(
				`The API key does not have access to the organization "${this.owner}" (available: ${accounts.join(', ')}).`,
			);
		}
		steps.push({
			name: 'organization',
			ok: true,
			message: `Organization "${this.owner}" is accessible.`,
		});

		// 3. Collection existence (read-only — a test must never create the collection).
		const col = await fetchJson(this.collectionPath(), this.apiKey);
		if (col.kind === 'network') {
			steps.push({
				name: 'collection',
				ok: false,
				message: `Could not reach ${this.collectionPath()}: ${col.error}`,
			});
			return fail(`Could not check the collection: ${col.error}`);
		}
		if (col.kind === 'json') {
			steps.push({
				name: 'collection',
				ok: true,
				message: `Collection "${this.owner}/${this.slug}" exists.`,
			});
			return { ok: true, message: `Connected to ${this.owner}/${this.slug}.`, steps };
		}
		if (col.status === 404) {
			steps.push({
				name: 'collection',
				ok: true,
				message: `Collection "${this.owner}/${this.slug}" does not exist yet — it will be created on the first push.`,
			});
			return {
				ok: true,
				collectionMissing: true,
				message: `Connected to ${this.owner}. The collection "${this.slug}" does not exist yet and will be created on the first push.`,
				steps,
			};
		}
		steps.push({
			name: 'collection',
			ok: false,
			message:
				col.kind === 'not-json'
					? `${this.collectionPath()} returned HTTP ${col.status} with a non-JSON body`
					: `${this.collectionPath()} returned HTTP ${col.status}: ${col.bodyText}`,
		});
		return fail(
			`Checking the collection "${this.owner}/${this.slug}" failed (HTTP ${col.status}).`,
		);
	}

	/** Ensure the collection exists, creating it under the org if missing. */
	async ensureCollection(): Promise<void> {
		// Authenticated for the same reason as readHead: an anonymous probe of a private collection
		// 404s, sending us down the create path for something that already exists.
		const response = await this.request(this.collectionPath(), { method: 'GET' });
		if (response.ok) {
			return;
		}
		if (response.status !== 404) {
			throw new UnderlayPushError('Failed to check collection', response.status);
		}
		const create = await this.request(
			`${this.baseUrl}/accounts/${encodeURIComponent(this.owner)}/collections`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: this.slug, name: this.slug, public: true }),
			},
		);
		if (!create.ok && create.status !== 409) {
			const detail = await create.text();
			throw new UnderlayPushError('Failed to create collection', create.status, detail);
		}
	}

	/**
	 * Upload one file's bytes, content-addressed by hash. Public so a push can stream files up as it
	 * maps them instead of accumulating every byte in memory until commit. Uploading a file the
	 * collection already holds is harmless, so re-uploading across attempts is too. A file uploaded
	 * and verified for the collection counts as held even if no version references it yet.
	 */
	async putFile(file: UnderlayFile): Promise<void> {
		if (file.bytes.length > SMALL_UPLOAD_BYTES) {
			return this.uploadLargeFile(file);
		}
		// Send the file's real content type — Underlay reports back whatever it received, so this is
		// what downstream consumers see. Falls back to octet-stream only when we truly don't know.
		const response = await this.request(`${this.collectionPath()}/files/${file.hash}`, {
			method: 'PUT',
			headers: { 'Content-Type': file.contentType || 'application/octet-stream' },
			rawBody: file.bytes,
		});
		if (response.status === 413) {
			// A server whose small-upload limit is below ours.
			return this.uploadLargeFile(file);
		}
		if (!response.ok) {
			throw new UnderlayPushError(
				`Failed to upload file ${file.hash}`,
				response.status,
				await this.body(response),
			);
		}
	}

	/**
	 * Presigned upload, for files over the plain PUT's limit (large PDF/EPUB exports): start an
	 * upload, PUT the bytes straight to storage, complete it, and wait until the server has hashed
	 * the bytes and marked the file verified. Up to 5 GiB is one PUT; beyond that the server asks for
	 * a multipart upload, which no PubPub export comes near, so that is refused clearly.
	 */
	private async uploadLargeFile(file: UnderlayFile): Promise<void> {
		const uploads = `${this.collectionPath()}/files/uploads`;
		const start = await this.request(uploads, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				hash: file.hash,
				size: file.bytes.length,
				mimeType: file.contentType || 'application/octet-stream',
			}),
		});
		if (!start.ok) {
			throw new UnderlayPushError(
				`Failed to start the upload of file ${file.hash}`,
				start.status,
				await this.body(start),
			);
		}
		const ticket = await this.json<{ id: string; url?: string }>(start);
		if (!ticket.url) {
			throw new UnderlayPushError(
				`File ${file.hash} (${file.bytes.length} bytes) needs a multipart upload, which PubPub does not support.`,
			);
		}

		// The presigned URL carries its own authorization; our API key must not go to storage.
		const put = await this.request(
			ticket.url,
			{ method: 'PUT', rawBody: file.bytes },
			{ auth: false, timeoutMs: LARGE_UPLOAD_TIMEOUT_MS },
		);
		if (!put.ok) {
			throw new UnderlayPushError(
				`Failed to upload file ${file.hash} to storage`,
				put.status,
				await this.body(put),
			);
		}

		const complete = await this.request(`${uploads}/${ticket.id}/complete`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{}',
		});
		if (!complete.ok) {
			throw new UnderlayPushError(
				`Failed to complete the upload of file ${file.hash}`,
				complete.status,
				await this.body(complete),
			);
		}

		const deadline = Date.now() + Math.min(this.pollTimeoutMs, UPLOAD_VERIFY_TIMEOUT_MS);
		let delay = this.pollIntervalMs;
		while (Date.now() < deadline) {
			// biome-ignore lint/performance/noAwaitInLoops: polling is inherently sequential
			await sleep(delay);
			delay = Math.min(COMMIT_POLL_MAX_MS, Math.round(delay * 1.5));
			let status: { status?: string; error?: unknown };
			try {
				const response = await this.request(`${uploads}/${ticket.id}`, { method: 'GET' });
				if (!response.ok) {
					continue;
				}
				status = await this.json<typeof status>(response);
			} catch {
				// A failed read isn't a failed upload; the server verifies regardless.
				continue;
			}
			if (status.status === 'verified') {
				return;
			}
			if (status.status === 'failed') {
				throw new UnderlayPushError(
					`Underlay could not verify the upload of file ${file.hash}`,
					undefined,
					status.error,
				);
			}
		}
		throw new UnderlayPushError(`The upload of file ${file.hash} was not verified in time.`);
	}

	/**
	 * Produce the body of every record to upsert. Fresh records are in memory; a record of a pub that
	 * came from the push cache is re-mapped on demand. Done BEFORE the session opens, so a slow
	 * re-render can't let the session's idle timer run out between uploads.
	 */
	private async resolveUpserts(
		upserts: ManifestEntry[],
		payload: UnderlayPushPayload,
	): Promise<UnderlayRecord[]> {
		const freshByKey = new Map<string, UnderlayRecord>();
		for (const record of payload.records) {
			freshByKey.set(recordKey(record.type, record.id), record);
		}
		const out: UnderlayRecord[] = [];
		for (const entry of upserts) {
			let record = freshByKey.get(recordKey(entry.type, entry.id));
			if (!record && payload.resolveRecord) {
				// biome-ignore lint/performance/noAwaitInLoops: lazy hydration is bounded by the upserts
				record = (await payload.resolveRecord(entry)) ?? undefined;
			}
			if (!record && payload.resolveRecordByHash) {
				// biome-ignore lint/performance/noAwaitInLoops: lazy hydration is bounded by the upserts
				record = (await payload.resolveRecordByHash(entry.hash)) ?? undefined;
			}
			if (!record) {
				throw new UnderlayPushError(
					`Underlay is missing record ${entry.type}/${entry.id}, and we can no longer produce it. ` +
						'This usually means content cached from a previous push (e.g. an asset inside a release) ' +
						'can no longer be regenerated — check the [underlay] warnings in the worker logs for skipped assets.',
				);
			}
			out.push(record);
		}
		return out;
	}

	/** Upload NDJSON lines to a session, in batches within the server's line and byte limits. */
	private async sendLines(
		sessionId: string,
		kind: 'records' | 'deletes',
		lines: string[],
		limits: SessionLimits,
	): Promise<void> {
		const maxLines = limits.batch_lines ?? DEFAULT_BATCH_LINES;
		const maxBytes = limits.batch_bytes ?? DEFAULT_BATCH_BYTES;
		let batch: string[] = [];
		let batchBytes = 0;
		const flush = async () => {
			const response = await this.request(
				`${this.collectionPath()}/push/${sessionId}/${kind}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/x-ndjson' },
					rawBody: `${batch.join('\n')}\n`,
				},
			);
			if (!response.ok) {
				throw new UnderlayPushError(
					`Underlay refused the ${kind} upload`,
					response.status,
					await this.body(response),
				);
			}
			batch = [];
			batchBytes = 0;
		};
		for (const line of lines) {
			const size = Buffer.byteLength(line) + 1;
			if (batch.length > 0 && (batch.length >= maxLines || batchBytes + size > maxBytes)) {
				// biome-ignore lint/performance/noAwaitInLoops: batches must be sent sequentially
				await flush();
			}
			batch.push(line);
			batchBytes += size;
		}
		if (batch.length > 0) {
			await flush();
		}
	}

	/** Best effort: free the session slot (20 per user) after a push fails partway. */
	private async abandon(sessionId: string): Promise<void> {
		try {
			await this.request(`${this.collectionPath()}/push/${sessionId}`, { method: 'DELETE' });
		} catch {
			// The server expires idle sessions on its own.
		}
	}

	/**
	 * Run the full push: diff `payload` against the head, then open a session, upload the upserts and
	 * deletes, and commit. `metadataPatch` holds version metadata fields to keep in sync (e.g.
	 * `{readme}`); only the fields that differ from the head are sent, and any metadata set in
	 * Underlay itself is left alone. Starts over once against the new head on a version conflict, or
	 * after uploading files a commit said were missing.
	 */
	async push(
		payload: UnderlayPushPayload,
		message: string,
		metadataPatch?: Record<string, unknown>,
	): Promise<PushResult> {
		// Incremental pushes supply a precomputed manifest spanning cache-reused + fresh records;
		// otherwise derive it from the in-memory records.
		const manifest = payload.manifest ?? buildManifest(payload.records);
		const filesByHash = new Map(payload.files.map((f) => [f.hash, f]));

		const attempt = async (): Promise<PushResult> => {
			const head = await this.readHead();
			const plan = diffAgainstHead(manifest, payload.schemas, hashSchema, head);
			const patch = metadataChanges(metadataPatch, head?.metadata ?? null);
			if (
				head &&
				plan.upserts.length === 0 &&
				plan.deletes.length === 0 &&
				!plan.schemasChanged &&
				!patch
			) {
				return { status: 'noop', reason: `Underlay ${head.semver} already matches` };
			}
			console.info(
				`[underlay] Diff against ${head?.semver ?? 'an empty collection'}: ${plan.upserts.length} upsert(s), ${plan.deletes.length} delete(s)${plan.schemasChanged ? ', schemas changed' : ''}${patch ? ', metadata changed' : ''}.`,
			);
			const upserts = await this.resolveUpserts(plan.upserts, payload);

			const open = await this.request(`${this.collectionPath()}/push`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					base: head?.semver ?? null,
					message,
					app_id: this.appId,
					actor_id: this.actorId,
					// The full type set: it replaces the base's.
					schemas: payload.schemas,
					...(patch ? { metadata_patch: patch } : {}),
				}),
			});
			if (open.status === 409) {
				throw new UnderlayPushError('Version conflict', 409, await this.body(open), true);
			}
			if (!open.ok) {
				throw new UnderlayPushError(
					'Could not open a push session',
					open.status,
					await this.body(open),
				);
			}
			const session = await this.json<{ session_id: string; limits?: SessionLimits }>(open);
			const limits = session.limits ?? {};

			try {
				await this.sendLines(
					session.session_id,
					'records',
					upserts.map((r) =>
						JSON.stringify({
							id: r.id,
							type: r.type,
							data: r.data,
							...(r.private ? { private: true } : {}),
						}),
					),
					limits,
				);
				await this.sendLines(
					session.session_id,
					'deletes',
					plan.deletes.map((d) => JSON.stringify({ type: d.type, id: d.id })),
					limits,
				);
				const result = await this.commit(
					session.session_id,
					filesByHash,
					payload.resolveFileByHash,
				);
				if (result.status === 'committed' && result.changes) {
					console.info(
						`[underlay] ${result.semver}: ${result.changes.added} added, ${result.changes.updated} updated, ${result.changes.removed} removed.`,
					);
				}
				return result;
			} catch (err) {
				await this.abandon(session.session_id);
				throw err;
			}
		};

		try {
			return await attempt();
		} catch (err) {
			if (err instanceof UnderlayPushError && err.retriable) {
				console.info(`[underlay] ${err.message}; starting over against the current head.`);
				return attempt();
			}
			throw err;
		}
	}

	/**
	 * Upload any files named in a `filesNeeded` rejection. Returns the hashes it could not produce.
	 */
	private async uploadMissingFiles(
		filesNeeded: string[],
		filesByHash: Map<string, UnderlayFile>,
		resolveFileByHash?: (hash: string) => Promise<UnderlayFile | null>,
	): Promise<string[]> {
		const unresolved: string[] = [];
		for (const ref of filesNeeded) {
			const hash = bareHash(ref);
			let file = filesByHash.get(hash);
			if (!file && resolveFileByHash) {
				// biome-ignore lint/performance/noAwaitInLoops: bounded retry
				file = (await resolveFileByHash(hash)) ?? undefined;
			}
			if (!file) {
				unresolved.push(hash);
				continue;
			}
			await this.putFile(file);
		}
		return unresolved;
	}

	/**
	 * Turn a refused commit into a result or an error. The body is the synchronous response, or a
	 * failed session's `error`; either way the session is now `failed` and can't be committed again.
	 */
	private async commitRefused(
		status: number | undefined,
		body: unknown,
		filesByHash: Map<string, UnderlayFile>,
		resolveFileByHash?: (hash: string) => Promise<UnderlayFile | null>,
	): Promise<PushResult> {
		const detail = (body && typeof body === 'object' ? body : {}) as CommitErrorBody;
		const code = status ?? detail.statusCode;
		if (detail.error === 'No changes detected') {
			return { status: 'noop', reason: 'Underlay reported no changes' };
		}
		if (detail.error === 'Version conflict') {
			throw new UnderlayPushError('Version conflict', 409, body, true);
		}
		if (detail.filesNeeded && detail.filesNeeded.length > 0) {
			const unresolved = await this.uploadMissingFiles(
				detail.filesNeeded,
				filesByHash,
				resolveFileByHash,
			);
			// Starting over when we know we could not supply everything just trades a specific
			// diagnosis for a generic failure.
			if (unresolved.length > 0) {
				throw new UnderlayPushError(
					`Commit rejected: the Underlay server needs ${unresolved.length} file(s) we can no longer produce. ` +
						'Check the [underlay] warnings in the worker logs for skipped assets.',
					422,
					body,
				);
			}
			throw new UnderlayPushError(
				'Commit rejected for missing files; they have been uploaded, retrying',
				422,
				body,
				true,
			);
		}
		if (code === 503) {
			// Storage cleanup ran during the commit; the server says to push again.
			throw new UnderlayPushError(
				detail.error ?? 'Underlay storage was busy',
				503,
				body,
				true,
			);
		}
		throw new UnderlayPushError(detail.error ?? 'Commit failed', code, body);
	}

	/**
	 * Poll a session whose commit was accepted asynchronously, until it reports a terminal status.
	 *
	 * A transient failure to *read* the session is not a failed commit — the commit is running
	 * server-side regardless — so read errors are swallowed and retried until the deadline.
	 */
	private async awaitAsyncCommit(
		sessionId: string,
		filesByHash: Map<string, UnderlayFile>,
		resolveFileByHash?: (hash: string) => Promise<UnderlayFile | null>,
	): Promise<PushResult> {
		const startedAt = Date.now();
		const deadline = startedAt + this.pollTimeoutMs;
		let delay = this.pollIntervalMs;
		let lastLoggedAt = startedAt;

		while (Date.now() < deadline) {
			// biome-ignore lint/performance/noAwaitInLoops: polling is inherently sequential
			await sleep(delay);
			delay = Math.min(COMMIT_POLL_MAX_MS, Math.round(delay * 1.5));

			// The server keeps committing regardless of whether we can read the session, so a failed
			// poll must not fail the push. `request` throws once its own retries are exhausted, and
			// a malformed body throws from `json` — both are transient from here, so both keep
			// polling. If reads never recover, the deadline below produces the actionable timeout.
			let session: {
				status: 'open' | 'committing' | 'committed' | 'failed' | 'expired';
				result?: {
					semver: string;
					hash: string;
					recordCount: number;
					fileCount: number;
					changes?: PushChanges;
				} | null;
				error?: unknown;
			};
			try {
				const response = await this.request(`${this.collectionPath()}/push/${sessionId}`, {
					method: 'GET',
				});
				if (!response.ok) {
					continue;
				}
				session = await this.json<typeof session>(response);
			} catch {
				continue;
			}

			if (session.status === 'committed') {
				if (!session.result?.semver) {
					throw new UnderlayPushError(
						'Underlay reported the commit as committed but returned no version',
						undefined,
						session,
					);
				}
				return { status: 'committed', ...session.result };
			}

			if (session.status === 'failed') {
				return this.commitRefused(
					undefined,
					session.error ?? { error: 'Underlay reported the commit as failed' },
					filesByHash,
					resolveFileByHash,
				);
			}

			if (session.status === 'expired') {
				throw new UnderlayPushError(
					'The push session expired before the commit finished',
					undefined,
					session,
				);
			}

			const now = Date.now();
			if (now - lastLoggedAt >= COMMIT_LOG_INTERVAL_MS) {
				lastLoggedAt = now;
				console.info(
					`[underlay] Commit still running (${Math.round((now - startedAt) / 1000)}s elapsed)…`,
				);
			}
		}

		throw new UnderlayPushError(
			`The commit did not finish within ${Math.round(this.pollTimeoutMs / 1000)}s. ` +
				'It may still complete server-side; check the collection before re-pushing.',
		);
	}

	private async commit(
		sessionId: string,
		filesByHash: Map<string, UnderlayFile>,
		resolveFileByHash?: (hash: string) => Promise<UnderlayFile | null>,
	): Promise<PushResult> {
		const response = await this.request(
			`${this.collectionPath()}/push/${sessionId}/commit?async=true`,
			{ method: 'POST' },
		);

		// 202: the server is committing in the background; the outcome lands on the session.
		if (response.status === 202) {
			return this.awaitAsyncCommit(sessionId, filesByHash, resolveFileByHash);
		}

		if (response.ok) {
			const committed = await this.json<{
				semver: string;
				hash: string;
				recordCount: number;
				fileCount: number;
				changes?: PushChanges;
			}>(response);
			return { status: 'committed', ...committed };
		}

		const body = await this.body(response);
		// A commit retried after a lost response finds its session already committing: keep polling
		// rather than reporting the first attempt's own progress as a failure.
		if (
			response.status === 409 &&
			(body as CommitErrorBody | null)?.error === 'Session is committing'
		) {
			return this.awaitAsyncCommit(sessionId, filesByHash, resolveFileByHash);
		}
		return this.commitRefused(response.status, body, filesByHash, resolveFileByHash);
	}
}
