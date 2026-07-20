import { hashRecord } from './hash';
import {
	buildManifest,
	type UnderlayFile,
	type UnderlayPushPayload,
	type UnderlayRecord,
} from './mapping';

/**
 * Minimal client for the Underlay push (negotiate) protocol.
 * @see https://underlay.org — public/llms.txt §"Writing Data: The Push Flow"
 *
 * Framework-free so it can be driven from a worker. Uses global fetch + AbortController; no
 * external HTTP dependency.
 */

const DEFAULT_BASE_URL = 'https://underlay.org/api';
const REQUEST_TIMEOUT_MS = 60_000;
const RECORD_BATCH_SIZE = 10_000;
const MAX_RETRIES = 4;

export type PushClientOptions = {
	apiKey: string;
	owner: string;
	slug: string;
	baseUrl?: string;
	/** Identifies the pushing app + actor in the commit metadata. */
	appId?: string;
	actorId?: string;
};

export type PushResult =
	| { status: 'noop'; reason: string }
	| { status: 'committed'; semver: string; hash: string; recordCount: number; fileCount: number };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class UnderlayPushError extends Error {
	constructor(
		message: string,
		public readonly statusCode?: number,
		public readonly detail?: unknown,
	) {
		super(message);
		this.name = 'UnderlayPushError';
	}
}

export class UnderlayClient {
	private readonly baseUrl: string;
	private readonly apiKey: string;
	private readonly owner: string;
	private readonly slug: string;
	private readonly appId: string;
	private readonly actorId: string;

	constructor(options: PushClientOptions) {
		this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
		this.apiKey = options.apiKey;
		this.owner = options.owner;
		this.slug = options.slug;
		this.appId = options.appId ?? 'pubpub';
		this.actorId = options.actorId ?? 'pubpub:push-to-underlay';
	}

	private collectionPath() {
		return `${this.baseUrl}/collections/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.slug)}`;
	}

	/** fetch with auth, timeout, and retry/backoff on 429 + 5xx. */
	private async request(
		url: string,
		init: RequestInit & { rawBody?: Buffer | string } = {},
		{ auth = true }: { auth?: boolean } = {},
	): Promise<Response> {
		const { rawBody, ...rest } = init;
		let lastError: unknown;
		for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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

	/** Returns the latest version semver, or null if the collection has no versions yet. */
	async getBaseVersion(): Promise<string | null> {
		const response = await this.request(
			`${this.collectionPath()}/versions/latest`,
			{
				method: 'GET',
			},
			{ auth: false },
		);
		if (response.status === 404) {
			return null;
		}
		if (!response.ok) {
			throw new UnderlayPushError('Failed to fetch latest version', response.status);
		}
		const body = await this.json<{ semver?: string }>(response);
		return body.semver ?? null;
	}

	/** Ensure the collection exists, creating it under the org if missing. */
	async ensureCollection(): Promise<void> {
		const response = await this.request(
			this.collectionPath(),
			{ method: 'GET' },
			{ auth: false },
		);
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

	private async uploadFile(file: UnderlayFile): Promise<void> {
		const response = await this.request(`${this.collectionPath()}/files/sha256:${file.hash}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/octet-stream' },
			rawBody: file.bytes,
		});
		if (!response.ok) {
			const detail = await response.text();
			throw new UnderlayPushError(
				`Failed to upload file ${file.hash}`,
				response.status,
				detail,
			);
		}
	}

	private async sendRecords(
		sessionId: string,
		neededHashes: string[],
		recordByHash: Map<string, UnderlayRecord>,
		resolveRecordByHash?: (hash: string) => Promise<UnderlayRecord | null>,
	) {
		// Resolve every needed hash to a record — from the in-memory set, or (incremental path) by
		// lazily re-hydrating the owning pub when the server asks for a record we didn't materialize.
		const toSend: UnderlayRecord[] = [];
		for (const hash of neededHashes) {
			let rec = recordByHash.get(hash);
			if (!rec && resolveRecordByHash) {
				// biome-ignore lint/performance/noAwaitInLoops: lazy hydration is bounded by needed records
				rec = (await resolveRecordByHash(hash)) ?? undefined;
			}
			if (!rec) {
				throw new UnderlayPushError(
					`Server requested a record we cannot produce (hash ${hash})`,
				);
			}
			toSend.push(rec);
		}
		for (let i = 0; i < toSend.length; i += RECORD_BATCH_SIZE) {
			const batch = toSend.slice(i, i + RECORD_BATCH_SIZE);
			const ndjson = `${batch
				.map((r) => JSON.stringify({ id: r.id, type: r.type, data: r.data }))
				.join('\n')}\n`;
			// biome-ignore lint/performance/noAwaitInLoops: batches must be sent sequentially
			const response = await this.request(
				`${this.collectionPath()}/versions/negotiate/${sessionId}/records`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/x-ndjson' },
					rawBody: ndjson,
				},
			);
			if (!response.ok) {
				const detail = await response.text();
				throw new UnderlayPushError('Failed to send records', response.status, detail);
			}
		}
	}

	/**
	 * Run the full push. `payload` is the mapped records/schemas/files; `baseVersion` is the semver
	 * the caller diffed against (null on first push). Retries once on a 409 version conflict by
	 * re-fetching the latest version and re-negotiating.
	 */
	async push(
		payload: UnderlayPushPayload,
		baseVersion: string | null,
		message: string,
	): Promise<PushResult> {
		// Incremental pushes supply a precomputed manifest spanning cache-reused + fresh records;
		// otherwise derive it from the in-memory records.
		const manifest = payload.manifest ?? buildManifest(payload.records);
		const recordByHash = new Map<string, UnderlayRecord>();
		for (const record of payload.records) {
			recordByHash.set(hashRecord(record).hash, record);
		}

		const negotiateOnce = async (base: string | null): Promise<PushResult> => {
			const negotiateResponse = await this.request(
				`${this.collectionPath()}/versions/negotiate`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						base_version: base,
						message,
						app_id: this.appId,
						actor_id: this.actorId,
						schemas: payload.schemas,
						manifest,
						files: payload.files.map((f) => f.hash),
					}),
				},
			);

			if (negotiateResponse.status === 409) {
				throw new UnderlayPushError('Version conflict', 409);
			}
			if (!negotiateResponse.ok) {
				const detail = await negotiateResponse.text();
				throw new UnderlayPushError('Negotiate failed', negotiateResponse.status, detail);
			}

			const session = await this.json<{
				session_id: string;
				needed_records: string[];
				needed_files: string[];
			}>(negotiateResponse);

			// Upload needed files.
			const filesByHash = new Map(payload.files.map((f) => [f.hash, f]));
			for (const hash of session.needed_files) {
				let file = filesByHash.get(hash);
				if (!file && payload.resolveFileByHash) {
					// biome-ignore lint/performance/noAwaitInLoops: lazy hydration is bounded by needed files
					file = (await payload.resolveFileByHash(hash)) ?? undefined;
				}
				if (!file) {
					throw new UnderlayPushError(`Server requested unknown file ${hash}`);
				}
				// biome-ignore lint/performance/noAwaitInLoops: bounded by needed files
				await this.uploadFile(file);
			}

			// Send needed records.
			if (session.needed_records.length > 0) {
				await this.sendRecords(
					session.session_id,
					session.needed_records,
					recordByHash,
					payload.resolveRecordByHash,
				);
			}

			// Commit, retrying once for late-uploaded files.
			const commit = await this.commit(
				session.session_id,
				filesByHash,
				payload.resolveFileByHash,
			);
			return commit;
		};

		try {
			return await negotiateOnce(baseVersion);
		} catch (err) {
			if (err instanceof UnderlayPushError && err.statusCode === 409) {
				// Someone pushed while we were diffing — re-fetch and retry once.
				const freshBase = await this.getBaseVersion();
				return negotiateOnce(freshBase);
			}
			throw err;
		}
	}

	private async commit(
		sessionId: string,
		filesByHash: Map<string, UnderlayFile>,
		resolveFileByHash?: (hash: string) => Promise<UnderlayFile | null>,
	): Promise<PushResult> {
		const doCommit = () =>
			this.request(`${this.collectionPath()}/versions/negotiate/${sessionId}/commit`, {
				method: 'POST',
			});

		let response = await doCommit();

		// 422 with missing files → upload them and retry once.
		if (response.status === 422) {
			const body = await this.json<{
				error?: string;
				filesNeeded?: string[];
				extraFields?: string[];
			}>(response);
			if (body.filesNeeded && body.filesNeeded.length > 0) {
				for (const ref of body.filesNeeded) {
					const hash = ref.replace(/^sha256:/, '');
					let file = filesByHash.get(hash);
					if (!file && resolveFileByHash) {
						// biome-ignore lint/performance/noAwaitInLoops: bounded retry
						file = (await resolveFileByHash(hash)) ?? undefined;
					}
					if (file) {
						// biome-ignore lint/performance/noAwaitInLoops: bounded retry
						await this.uploadFile(file);
					}
				}
				response = await doCommit();
			} else {
				throw new UnderlayPushError(
					body.error ?? 'Commit rejected (422)',
					422,
					body.extraFields ?? body,
				);
			}
		}

		if (!response.ok) {
			const detail = await response.text();
			throw new UnderlayPushError('Commit failed', response.status, detail);
		}

		const committed = await this.json<{
			semver: string;
			hash: string;
			recordCount: number;
			fileCount: number;
		}>(response);
		return { status: 'committed', ...committed };
	}
}
