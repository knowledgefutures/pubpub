import type { UnderlayPushPayload, UnderlayRecord } from '../mapping';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { diffAgainstHead, metadataChanges, UnderlayClient } from '../client';
import { hashRecord, hashSchema } from '../hash';

/**
 * Delta push. The client reads the head's manifest, diffs its own records against it, and uploads
 * only upserts and deletes through a push session. These tests drive the client against a small
 * in-memory fake of Underlay's push API.
 */

const BASE = 'https://underlay.test/api';
const COLLECTION = `${BASE}/collections/org/coll`;

const makeClient = () =>
	new UnderlayClient({
		apiKey: 'key',
		owner: 'org',
		slug: 'coll',
		baseUrl: BASE,
		pollIntervalMs: 1,
		pollTimeoutMs: 500,
	});

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const PubSchema = { type: 'object', properties: { slug: { type: 'string' } } };
const NoteSchema = { type: 'object', properties: { text: { type: 'string' } } };

const rec = (id: string, slug: string, type = 'Pub'): UnderlayRecord => ({
	id,
	type,
	data: { slug },
});

const payloadOf = (
	records: UnderlayRecord[],
	extra: Partial<UnderlayPushPayload> = {},
): UnderlayPushPayload => ({
	records,
	files: [],
	fileHashes: [],
	schemas: { Pub: PubSchema },
	...extra,
});

type HeadRecord = { id: string; type: string; hash: string; private?: boolean };

const headOf = (records: UnderlayRecord[], extra: HeadRecord[] = []): HeadRecord[] => [
	...records.map((r) => ({
		id: r.id,
		type: r.type,
		hash: hashRecord(r).hash,
		...(r.private ? { private: true } : {}),
	})),
	...extra,
];

type Fake = {
	calls: string[];
	/** Bodies of every `POST /push` (session open). */
	opens: Record<string, unknown>[];
	/** NDJSON lines uploaded per kind, across all sessions. */
	lines: { records: Record<string, unknown>[]; deletes: Record<string, unknown>[] };
	/** Request bodies (line counts) of each records/deletes POST, in order. */
	batches: { kind: string; lines: number }[];
	headers: { url: string; auth: boolean }[];
};

/**
 * A fake Underlay. `head` is the current version (null = no versions); `commit` scripts each
 * commit's response; `sessionStates` is consumed one poll at a time.
 */
const fakeUnderlay = (opts: {
	head?: {
		semver: string;
		records: HeadRecord[];
		schemas?: Record<string, unknown>;
		metadata?: Record<string, unknown> | null;
	} | null;
	manifestPageSize?: number;
	open?: () => Response | null;
	commit?: () => Response;
	sessionStates?: unknown[];
	recordsResponse?: () => Response;
	limits?: Record<string, number>;
	onPut?: (url: string) => void;
	upload?: { statuses: string[] };
}): Fake => {
	const fake: Fake = {
		calls: [],
		opens: [],
		lines: { records: [], deletes: [] },
		batches: [],
		headers: [],
	};
	const states = [...(opts.sessionStates ?? [])];
	const uploadStatuses = [...(opts.upload?.statuses ?? [])];
	let sessionCount = 0;
	const head = opts.head ?? null;
	const pageSize = opts.manifestPageSize ?? 25_000;

	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: any, init?: any) => {
			const url = String(input);
			const method = init?.method ?? 'GET';
			fake.calls.push(`${method} ${url}`);
			fake.headers.push({ url, auth: new Headers(init?.headers).has('Authorization') });
			const path = url.split('?')[0];
			const query = new URL(url).searchParams;

			if (path === `${COLLECTION}/versions/latest`) {
				return head
					? json({ semver: head.semver, metadata: head.metadata ?? null })
					: json({ error: 'No versions' }, 404);
			}
			if (head && path === `${COLLECTION}/versions/${head.semver}/manifest`) {
				const start = Number(query.get('cursor') ?? 0);
				const page = head.records.slice(start, start + pageSize);
				const next = start + pageSize;
				return json({
					semver: head.semver,
					schemas: Object.fromEntries(
						Object.entries(head.schemas ?? { Pub: PubSchema }).map(([t, s]) => [
							t,
							hashSchema(s),
						]),
					),
					records: page,
					pagination: {
						hasMore: next < head.records.length,
						nextCursor: next < head.records.length ? String(next) : null,
					},
				});
			}
			if (method === 'POST' && path === `${COLLECTION}/push`) {
				fake.opens.push(JSON.parse(init.body));
				const custom = opts.open?.();
				if (custom) return custom;
				sessionCount += 1;
				return json({
					session_id: `s${sessionCount}`,
					base: head?.semver ?? null,
					needed_files: [],
					limits: opts.limits ?? {},
				});
			}
			const sessionMatch = path.match(/\/push\/(s\d+)(?:\/(records|deletes|commit))?$/);
			if (sessionMatch) {
				const [, , action] = sessionMatch;
				if (method === 'POST' && (action === 'records' || action === 'deletes')) {
					const lines = String(init.body)
						.split('\n')
						.filter(Boolean)
						.map((l) => JSON.parse(l));
					fake.batches.push({ kind: action, lines: lines.length });
					fake.lines[action].push(...lines);
					if (action === 'records' && opts.recordsResponse) return opts.recordsResponse();
					return json({ received: lines.length });
				}
				if (method === 'POST' && action === 'commit') {
					return opts.commit
						? opts.commit()
						: json(
								{ semver: 'v1.1.0', hash: 'ulv2:x', recordCount: 1, fileCount: 0 },
								201,
							);
				}
				if (method === 'DELETE') return json({ ok: true });
				if (method === 'GET') return json(states.shift() ?? { status: 'committing' });
			}
			if (method === 'POST' && path === `${COLLECTION}/files/uploads`) {
				return json({ id: 'u1', url: 'https://storage.test/put/u1', expiresIn: 3600 }, 201);
			}
			if (url === 'https://storage.test/put/u1') return new Response(null, { status: 200 });
			if (method === 'POST' && path === `${COLLECTION}/files/uploads/u1/complete`) {
				return json({ id: 'u1', status: 'verifying' }, 202);
			}
			if (method === 'GET' && path === `${COLLECTION}/files/uploads/u1`) {
				return json({ id: 'u1', status: uploadStatuses.shift() ?? 'verified' });
			}
			if (method === 'PUT' && path.startsWith(`${COLLECTION}/files/`)) {
				opts.onPut?.(url);
				return json({ status: 'stored' }, 201);
			}
			throw new Error(`unexpected fetch: ${method} ${url}`);
		}),
	);
	return fake;
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('underlay/client — diff', () => {
	it('upserts new and changed records, deletes vanished ones, and leaves the rest alone', () => {
		const same = rec('a', 'same');
		const changed = rec('b', 'new');
		const added = rec('c', 'added');
		const head = {
			semver: 'v1.0.0',
			metadata: null,
			schemaHashes: { Pub: hashSchema(PubSchema), Note: hashSchema(NoteSchema) },
			records: new Map(
				[
					...headOf([same, rec('b', 'old'), rec('gone', 'x')]),
					// A type we no longer push: dropping the type removes it, so no delete line.
					{ id: 'n1', type: 'Note', hash: 'h' },
				].map((r) => [`${r.type}\u0000${r.id}`, { ...r, private: false }]),
			),
		};
		const manifest = headOf([same, changed, added]);
		const plan = diffAgainstHead(manifest, { Pub: PubSchema }, hashSchema, head);
		expect(plan.upserts.map((u) => u.id).sort()).toEqual(['b', 'c']);
		expect(plan.deletes).toEqual([{ type: 'Pub', id: 'gone' }]);
		// The Note type is gone from our schema set.
		expect(plan.schemasChanged).toBe(true);
	});

	it('upserts a record whose hash is unchanged but whose access set moved', () => {
		const r = rec('a', 'x');
		const head = {
			semver: 'v1.0.0',
			metadata: null,
			schemaHashes: { Pub: hashSchema(PubSchema) },
			records: new Map([
				[`Pub\u0000a`, { id: 'a', type: 'Pub', hash: hashRecord(r).hash, private: true }],
			]),
		};
		const plan = diffAgainstHead(headOf([r]), { Pub: PubSchema }, hashSchema, head);
		expect(plan.upserts.map((u) => u.id)).toEqual(['a']);
		expect(plan.schemasChanged).toBe(false);
	});

	it('sends only the metadata fields that differ, treating null as absent', () => {
		expect(metadataChanges({ readme: 'x' }, { readme: 'x', description: 'd' })).toBeNull();
		expect(metadataChanges({ readme: null }, null)).toBeNull();
		expect(metadataChanges({ readme: null }, { readme: 'old' })).toEqual({ readme: null });
		expect(metadataChanges({ readme: 'new' }, { readme: 'old' })).toEqual({ readme: 'new' });
	});
});

describe('underlay/client — push', () => {
	it('first push: opens against base null and uploads every record', async () => {
		const fake = fakeUnderlay({ head: null });
		const records = [rec('a', '1'), rec('b', '2')];
		const result = await makeClient().push(payloadOf(records), 'msg', { readme: 'hi' });

		expect(result).toMatchObject({ status: 'committed', semver: 'v1.1.0' });
		expect(fake.opens[0]).toMatchObject({
			base: null,
			message: 'msg',
			app_id: 'pubpub',
			schemas: { Pub: PubSchema },
			metadata_patch: { readme: 'hi' },
		});
		// Negotiate-era fields must not leak into the open: `files` would make referenced files
		// members-only, and `manifest` no longer exists.
		expect(fake.opens[0]).not.toHaveProperty('files');
		expect(fake.opens[0]).not.toHaveProperty('manifest');
		expect(fake.lines.records.map((l) => l.id)).toEqual(['a', 'b']);
		expect(fake.batches.some((b) => b.kind === 'deletes')).toBe(false);
	});

	it('uploads only the diff against the head', async () => {
		const fake = fakeUnderlay({
			head: {
				semver: 'v2.0.0',
				records: headOf([rec('a', '1'), rec('b', 'old'), rec('gone', 'x')]),
			},
		});
		await makeClient().push(payloadOf([rec('a', '1'), rec('b', 'new'), rec('c', '3')]), 'msg');

		expect(fake.opens[0].base).toBe('v2.0.0');
		expect(fake.lines.records.map((l) => l.id).sort()).toEqual(['b', 'c']);
		expect(fake.lines.deletes).toEqual([{ type: 'Pub', id: 'gone' }]);
	});

	it('does not open a session when the head already matches', async () => {
		const records = [rec('a', '1')];
		const fake = fakeUnderlay({
			head: { semver: 'v2.0.0', records: headOf(records), metadata: { readme: 'same' } },
		});
		const result = await makeClient().push(payloadOf(records), 'msg', { readme: 'same' });

		expect(result.status).toBe('noop');
		expect(fake.opens).toHaveLength(0);
	});

	it('pushes a readme-only change as a metadata patch', async () => {
		const records = [rec('a', '1')];
		const fake = fakeUnderlay({
			head: {
				semver: 'v2.0.0',
				records: headOf(records),
				metadata: { readme: 'old', license: 'CC-BY' },
			},
		});
		await makeClient().push(payloadOf(records), 'msg', { readme: 'new' });

		// Only the readme: the license set in Underlay is not ours to overwrite.
		expect(fake.opens[0].metadata_patch).toEqual({ readme: 'new' });
		expect(fake.lines.records).toHaveLength(0);
	});

	it('reads every manifest page, pinned to the head semver', async () => {
		const records = [rec('a', '1'), rec('b', '2'), rec('c', '3')];
		const fake = fakeUnderlay({
			head: { semver: 'v2.0.0', records: headOf(records) },
			manifestPageSize: 2,
		});
		const result = await makeClient().push(payloadOf(records), 'msg');

		// Records on page two were seen too, so nothing looked new.
		expect(result.status).toBe('noop');
		const manifestCalls = fake.calls.filter((c) => c.includes('/manifest'));
		expect(manifestCalls).toHaveLength(2);
		expect(manifestCalls.every((c) => c.includes('/versions/v2.0.0/manifest'))).toBe(true);
	});

	it('splits uploads by the session limits on lines and bytes', async () => {
		const records = Array.from({ length: 5 }, (_, i) => rec(`r${i}`, 'x'.repeat(50)));
		const fake = fakeUnderlay({
			head: null,
			limits: { batch_lines: 2, batch_bytes: 1_000_000 },
		});
		await makeClient().push(payloadOf(records), 'msg');
		expect(fake.batches.map((b) => b.lines)).toEqual([2, 2, 1]);

		vi.unstubAllGlobals();
		// Each line is ~85 bytes, so a 200-byte budget fits two.
		const byBytes = fakeUnderlay({
			head: null,
			limits: { batch_lines: 100, batch_bytes: 200 },
		});
		await makeClient().push(payloadOf(records), 'msg');
		expect(byBytes.batches.map((b) => b.lines)).toEqual([2, 2, 1]);
	});

	it('sends the private flag on records that carry it', async () => {
		const fake = fakeUnderlay({ head: null });
		await makeClient().push(
			payloadOf([{ ...rec('a', '1'), private: true }, rec('b', '2')]),
			'msg',
		);
		expect(fake.lines.records).toEqual([
			{ id: 'a', type: 'Pub', data: { slug: '1' }, private: true },
			{ id: 'b', type: 'Pub', data: { slug: '2' } },
		]);
	});

	it('produces a cache-hit record the head lacks through resolveRecord', async () => {
		const cached = rec('cached', 'from-cache');
		const fake = fakeUnderlay({ head: { semver: 'v1.0.0', records: [] } });
		const resolveRecord = vi.fn(async () => cached);
		await makeClient().push(
			payloadOf([], { manifest: headOf([cached]), resolveRecord }),
			'msg',
		);
		expect(resolveRecord).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'cached', type: 'Pub' }),
		);
		expect(fake.lines.records.map((l) => l.id)).toEqual(['cached']);
	});

	it('fails clearly, and abandons the session, when a record cannot be produced', async () => {
		fakeUnderlay({ head: null });
		await expect(
			makeClient().push(payloadOf([], { manifest: headOf([rec('lost', 'x')]) }), 'msg'),
		).rejects.toThrow(/can no longer produce/);
	});

	it('abandons the session when the server refuses an upload', async () => {
		const fake = fakeUnderlay({
			head: null,
			recordsResponse: () =>
				json(
					{ error: 'Invalid records', validationErrors: [{ line: 1 }], totalErrors: 1 },
					422,
				),
		});
		await expect(makeClient().push(payloadOf([rec('a', '1')]), 'msg')).rejects.toThrow(
			/refused the records upload/,
		);
		expect(fake.calls).toContain(`DELETE ${COLLECTION}/push/s1`);
	});

	it('starts over against the new head after a version conflict at open', async () => {
		let opens = 0;
		const fake = fakeUnderlay({
			head: { semver: 'v1.0.0', records: [] },
			open: () => {
				opens += 1;
				return opens === 1
					? json({ error: 'Version conflict', currentVersion: 'v1.1.0' }, 409)
					: null;
			},
		});
		const result = await makeClient().push(payloadOf([rec('a', '1')]), 'msg');
		expect(result.status).toBe('committed');
		expect(fake.opens).toHaveLength(2);
		// The head was re-read before the second open.
		expect(fake.calls.filter((c) => c.endsWith('/versions/latest'))).toHaveLength(2);
	});

	it('treats "No changes detected" at commit as a noop, not a conflict', async () => {
		const fake = fakeUnderlay({
			head: null,
			commit: () => json({ error: 'No changes detected', hash: 'ulv2:x' }, 409),
		});
		const result = await makeClient().push(payloadOf([rec('a', '1')]), 'msg');
		expect(result.status).toBe('noop');
		expect(fake.opens).toHaveLength(1);
	});

	it('sends credentials when reading the head', async () => {
		const fake = fakeUnderlay({ head: { semver: 'v3.0.0', records: [] } });
		const head = await makeClient().readHead();
		expect(head?.semver).toBe('v3.0.0');
		// Anonymous, these 404 on a private collection and every record looks new.
		expect(fake.headers.filter((h) => h.url.includes('/versions/')).every((h) => h.auth)).toBe(
			true,
		);
	});
});

describe('underlay/client — async commit', () => {
	it('requests an async commit and polls the session until it is committed', async () => {
		const fake = fakeUnderlay({
			head: null,
			commit: () => json({ session_id: 's1', status: 'committing' }, 202),
			sessionStates: [
				{ status: 'committing', result: null, error: null },
				{
					status: 'committed',
					result: {
						semver: 'v1.1.0',
						hash: 'abc',
						recordCount: 1,
						fileCount: 0,
						changes: { added: 1, updated: 0, removed: 0 },
					},
				},
			],
		});

		const result = await makeClient().push(payloadOf([rec('a', '1')]), 'msg');

		expect(result).toEqual({
			status: 'committed',
			semver: 'v1.1.0',
			hash: 'abc',
			recordCount: 1,
			fileCount: 0,
			changes: { added: 1, updated: 0, removed: 0 },
		});
		// The commit must opt in to async, or the request hangs open past the 60s client timeout.
		expect(fake.calls.some((c) => c.includes('/push/s1/commit?async=true'))).toBe(true);
		// It kept polling through the non-terminal state rather than giving up on the first read.
		expect(fake.calls.filter((c) => c === `GET ${COLLECTION}/push/s1`)).toHaveLength(2);
	});

	it('accepts a synchronous 201', async () => {
		const fake = fakeUnderlay({
			head: null,
			commit: () =>
				json({ semver: 'v2.0.0', hash: 'def', recordCount: 1, fileCount: 0 }, 201),
		});
		const result = await makeClient().push(payloadOf([rec('a', '1')]), 'msg');
		expect(result).toMatchObject({ status: 'committed', semver: 'v2.0.0' });
		expect(fake.calls.some((c) => c === `GET ${COLLECTION}/push/s1`)).toBe(false);
	});

	it('surfaces the server error when the async commit fails', async () => {
		fakeUnderlay({
			head: null,
			commit: () => json({ session_id: 's1', status: 'committing' }, 202),
			sessionStates: [
				{ status: 'failed', error: { statusCode: 422, error: 'Schema validation failed' } },
			],
		});
		await expect(makeClient().push(payloadOf([rec('a', '1')]), 'msg')).rejects.toThrow(
			/Schema validation failed/,
		);
	});

	it('fails with a clear message when the session expires mid-commit', async () => {
		fakeUnderlay({
			head: null,
			commit: () => json({ session_id: 's1', status: 'committing' }, 202),
			sessionStates: [{ status: 'expired' }],
		});
		await expect(makeClient().push(payloadOf([rec('a', '1')]), 'msg')).rejects.toThrow(
			/expired/i,
		);
	});

	it('gives up with an actionable message if the commit never reaches a terminal state', async () => {
		fakeUnderlay({
			head: null,
			commit: () => json({ session_id: 's1', status: 'committing' }, 202),
			sessionStates: [],
		});
		await expect(makeClient().push(payloadOf([rec('a', '1')]), 'msg')).rejects.toThrow(
			/did not finish within/,
		);
	});

	it('uploads files a failed commit asked for, then starts a new session and succeeds', async () => {
		const uploaded: string[] = [];
		let commits = 0;
		const fake = fakeUnderlay({
			head: null,
			commit: () => {
				commits += 1;
				return json({ session_id: `s${commits}`, status: 'committing' }, 202);
			},
			sessionStates: [
				{
					status: 'failed',
					error: { statusCode: 422, error: 'Missing files', filesNeeded: ['f1'] },
				},
				{
					status: 'committed',
					result: { semver: 'v1.2.0', hash: 'ghi', recordCount: 1, fileCount: 1 },
				},
			],
			onPut: (url) => uploaded.push(url),
		});

		const result = await makeClient().push(
			payloadOf([rec('a', '1')], {
				files: [{ hash: 'f1', contentType: 'text/html', bytes: Buffer.from('x') }],
				fileHashes: ['f1'],
			}),
			'msg',
		);

		expect(result.status).toBe('committed');
		expect(uploaded.some((u) => u.endsWith('/files/f1'))).toBe(true);
		// The failed session can't be committed again, so recovery is a second session.
		expect(fake.opens).toHaveLength(2);
		expect(commits).toBe(2);
	});

	it('does not retry when a missing file cannot be produced', async () => {
		const fake = fakeUnderlay({
			head: null,
			commit: () => json({ error: 'Missing files', filesNeeded: ['missing'] }, 422),
		});
		await expect(makeClient().push(payloadOf([rec('a', '1')]), 'msg')).rejects.toThrow(
			/can no longer produce/,
		);
		expect(fake.opens).toHaveLength(1);
	});

	it('keeps polling when a session read fails, instead of failing a commit that is still running', async () => {
		let polls = 0;
		fakeUnderlay({ head: null, commit: () => json({ session_id: 's1' }, 202) });
		const fakeFetch = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
		const inner = fakeFetch.getMockImplementation()! as (
			input: any,
			init?: any,
		) => Promise<Response>;
		fakeFetch.mockImplementation(async (input: any, init?: any) => {
			if (String(input) === `${COLLECTION}/push/s1` && (init?.method ?? 'GET') === 'GET') {
				polls += 1;
				// A 200 whose body is not JSON: `json()` throws, which reaches the poll loop's catch
				// directly. (Throwing from fetch would be absorbed by `request`'s own retry.)
				if (polls <= 3) {
					return new Response('<html>502 upstream</html>', { status: 200 });
				}
				return json({
					status: 'committed',
					result: { semver: 'v1.1.0', hash: 'h', recordCount: 1, fileCount: 0 },
				});
			}
			return inner(input, init);
		});

		const result = await makeClient().push(payloadOf([rec('a', '1')]), 'msg');
		expect(result).toMatchObject({ status: 'committed', semver: 'v1.1.0' });
		expect(polls).toBeGreaterThan(3);
	});
});

describe('underlay/client — files', () => {
	it('uploads a file over 32 MB through a presigned upload, without sending the API key to storage', async () => {
		const fake = fakeUnderlay({ head: null, upload: { statuses: ['verifying', 'verified'] } });
		const bytes = Buffer.alloc(32 * 1024 * 1024 + 1);
		await makeClient().putFile({ hash: 'big', contentType: 'application/pdf', bytes });

		expect(fake.calls).toEqual([
			`POST ${COLLECTION}/files/uploads`,
			'PUT https://storage.test/put/u1',
			`POST ${COLLECTION}/files/uploads/u1/complete`,
			`GET ${COLLECTION}/files/uploads/u1`,
			`GET ${COLLECTION}/files/uploads/u1`,
		]);
		expect(fake.headers.find((h) => h.url.startsWith('https://storage.test'))?.auth).toBe(
			false,
		);
	});

	it('fails when the server cannot verify a presigned upload', async () => {
		fakeUnderlay({ head: null, upload: { statuses: ['failed'] } });
		await expect(
			makeClient().putFile({
				hash: 'big',
				contentType: 'application/pdf',
				bytes: Buffer.alloc(32 * 1024 * 1024 + 1),
			}),
		).rejects.toThrow(/could not verify/);
	});

	it('uploads small files with a plain PUT', async () => {
		const fake = fakeUnderlay({ head: null });
		await makeClient().putFile({
			hash: 'small',
			contentType: 'text/html',
			bytes: Buffer.from('x'),
		});
		expect(fake.calls).toEqual([`PUT ${COLLECTION}/files/small`]);
	});
});

describe('underlay/client — connection', () => {
	it('sends credentials when checking whether the collection exists', async () => {
		const seen: { url: string; auth: boolean }[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: any, init?: any) => {
				seen.push({
					url: String(input),
					auth: new Headers(init?.headers).has('Authorization'),
				});
				return json({ slug: 'coll' });
			}),
		);
		await makeClient().ensureCollection();
		expect(seen[0]?.auth).toBe(true);
		// It existed, so nothing was created.
		expect(seen.some((c) => c.url.endsWith('/collections'))).toBe(false);
	});

	it("checks the organization against /accounts/me's orgs", async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: any) =>
				String(input).endsWith('/accounts/me')
					? json({ id: 'u', orgs: [{ slug: 'someone-else', name: 'Else' }] })
					: json({ slug: 'coll' }),
			),
		);
		const check = await makeClient().verifyConnection();
		expect(check.ok).toBe(false);
		expect(check.message).toMatch(/does not have access to the organization "org"/);
	});
});
