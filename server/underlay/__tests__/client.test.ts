import type { UnderlayPushPayload } from '../mapping';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { UnderlayClient } from '../client';

/**
 * Async commit. Underlay finalizes a large commit in the background: it answers 202 and records the
 * outcome on the session, which the client polls. These tests pin that handshake — including the
 * fallback to a synchronous 201, so the two services can be deployed in either order.
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

/** A minimal push: one record, no files. */
const payload = (): UnderlayPushPayload => ({
	records: [{ id: 'r1', type: 'Pub', data: { slug: 'p1' } }],
	files: [],
	fileHashes: [],
	schemas: {},
	manifest: [{ id: 'r1', type: 'Pub', hash: 'h1' }],
});

/**
 * Routes fetches by URL so a test only has to describe the handful of responses it cares about.
 * `sessionStates` is consumed one poll at a time, so a test can script `committing → committed`.
 */
const stubFetch = (opts: {
	commit: Response | (() => Response);
	sessionStates?: unknown[];
	onPut?: (url: string) => void;
}) => {
	const calls: string[] = [];
	const states = [...(opts.sessionStates ?? [])];
	const fetchMock = vi.fn(async (input: any, init?: any) => {
		const url = String(input);
		calls.push(`${init?.method ?? 'GET'} ${url}`);

		// Re-read of the current head, done when push() recovers by re-negotiating.
		if (url.endsWith('/versions/latest')) {
			return json({ semver: '1.0.0' });
		}
		if (url.endsWith('/versions/negotiate')) {
			// The server already has the records; these tests are about the commit handshake.
			return json({ session_id: 's1', needed_records: [], needed_files: [] });
		}
		if (url.includes('/versions/negotiate/s1/records')) {
			return json({ ok: true });
		}
		if (url.includes('/versions/negotiate/s1/commit')) {
			return typeof opts.commit === 'function' ? opts.commit() : opts.commit;
		}
		if (url.includes('/files/sha256:')) {
			opts.onPut?.(url);
			return json({ status: 'exists' });
		}
		// Session poll.
		if (url.endsWith('/versions/negotiate/s1')) {
			return json(states.shift() ?? { status: 'committing' });
		}
		throw new Error(`unexpected fetch: ${url}`);
	});
	vi.stubGlobal('fetch', fetchMock);
	return { calls, fetchMock };
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('underlay/client — async commit', () => {
	it('requests an async commit and polls the session until it is committed', async () => {
		const { calls } = stubFetch({
			commit: json({ session_id: 's1', status: 'committing' }, 202),
			sessionStates: [
				{ status: 'committing', result: null, error: null },
				{
					status: 'committed',
					result: { semver: '1.1.0', hash: 'abc', recordCount: 1, fileCount: 0 },
				},
			],
		});

		const result = await makeClient().push(payload(), '1.0.0', 'msg');

		expect(result).toEqual({
			status: 'committed',
			semver: '1.1.0',
			hash: 'abc',
			recordCount: 1,
			fileCount: 0,
		});
		// The commit must opt in to async, or the request hangs open past the 60s client timeout.
		expect(calls.some((c) => c.includes('/commit?async=true'))).toBe(true);
		// It kept polling through the non-terminal state rather than giving up on the first read.
		expect(calls.filter((c) => c === `GET ${COLLECTION}/versions/negotiate/s1`)).toHaveLength(
			2,
		);
	});

	it('still accepts a synchronous 201 from an Underlay that predates async commit', async () => {
		const { calls } = stubFetch({
			commit: json({ semver: '2.0.0', hash: 'def', recordCount: 1, fileCount: 0 }, 201),
		});

		const result = await makeClient().push(payload(), '1.0.0', 'msg');

		expect(result).toEqual({
			status: 'committed',
			semver: '2.0.0',
			hash: 'def',
			recordCount: 1,
			fileCount: 0,
		});
		// No polling — the version came back inline.
		expect(calls.some((c) => c === `GET ${COLLECTION}/versions/negotiate/s1`)).toBe(false);
	});

	it('surfaces the server error when the async finalize fails', async () => {
		stubFetch({
			commit: json({ session_id: 's1', status: 'committing' }, 202),
			sessionStates: [
				{ status: 'failed', error: { statusCode: 400, error: 'Manifest incomplete' } },
			],
		});

		await expect(makeClient().push(payload(), '1.0.0', 'msg')).rejects.toThrow(
			/Manifest incomplete/,
		);
	});

	it('fails with a clear message when the session expires mid-commit', async () => {
		stubFetch({
			commit: json({ session_id: 's1', status: 'committing' }, 202),
			sessionStates: [{ status: 'expired' }],
		});

		await expect(makeClient().push(payload(), '1.0.0', 'msg')).rejects.toThrow(/expired/i);
	});

	it('gives up with an actionable message if the commit never reaches a terminal state', async () => {
		stubFetch({
			commit: json({ session_id: 's1', status: 'committing' }, 202),
			sessionStates: [], // always 'committing'
		});

		await expect(makeClient().push(payload(), '1.0.0', 'msg')).rejects.toThrow(
			/did not finish within/,
		);
	});

	it('uploads files the failed commit asked for, then re-negotiates and succeeds', async () => {
		const uploaded: string[] = [];
		let commitCount = 0;
		// First commit fails wanting a file; after we upload it, the retried push commits.
		const { calls } = stubFetch({
			commit: () => {
				commitCount += 1;
				return json({ session_id: 's1', status: 'committing' }, 202);
			},
			sessionStates: [
				{ status: 'failed', error: { filesNeeded: ['sha256:f1'] } },
				{
					status: 'committed',
					result: { semver: '1.2.0', hash: 'ghi', recordCount: 1, fileCount: 1 },
				},
			],
			onPut: (url) => uploaded.push(url),
		});

		const withFile: UnderlayPushPayload = {
			...payload(),
			files: [{ hash: 'f1', contentType: 'text/html', bytes: Buffer.from('x') }],
			fileHashes: ['f1'],
		};

		const result = await makeClient().push(withFile, '1.0.0', 'msg');

		expect(result.status).toBe('committed');
		expect(uploaded.some((u) => u.includes('sha256:f1'))).toBe(true);
		// The failed session can't be re-committed, so recovery means a second negotiate.
		expect(calls.filter((c) => c === `POST ${COLLECTION}/versions/negotiate`)).toHaveLength(2);
		expect(commitCount).toBe(2);
	});

	it('does not retry forever when the needed file cannot be produced', async () => {
		stubFetch({
			commit: json({ session_id: 's1', status: 'committing' }, 202),
			sessionStates: [{ status: 'failed', error: { filesNeeded: ['sha256:missing'] } }],
		});

		await expect(makeClient().push(payload(), '1.0.0', 'msg')).rejects.toThrow(
			/can no longer produce/,
		);
	});
});

describe('underlay/client — authenticated reads', () => {
	it('sends credentials when reading the latest version', async () => {
		const seen: { url: string; auth: boolean }[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: any, init?: any) => {
				const headers = new Headers(init?.headers);
				seen.push({ url: String(input), auth: headers.has('Authorization') });
				if (String(input).endsWith('/versions/latest')) {
					return json({ semver: '3.0.0' });
				}
				return json({}, 404);
			}),
		);

		const base = await makeClient().getBaseVersion();
		expect(base).toBe('3.0.0');

		// Anonymous, this 404s on a private collection and is misread as "no versions yet" — which
		// then pushes base_version: null and dies on a 409 conflict.
		const call = seen.find((c) => c.url.endsWith('/versions/latest'));
		expect(call?.auth).toBe(true);
	});

	it('sends credentials when checking whether the collection exists', async () => {
		const seen: { url: string; auth: boolean }[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: any, init?: any) => {
				const headers = new Headers(init?.headers);
				seen.push({ url: String(input), auth: headers.has('Authorization') });
				return json({ slug: 'coll' });
			}),
		);

		await makeClient().ensureCollection();
		expect(seen[0]?.auth).toBe(true);
		// It existed, so nothing was created.
		expect(seen.some((c) => c.url.endsWith('/collections'))).toBe(false);
	});
});

describe('underlay/client — poll resilience and missing-file diagnosis', () => {
	it('keeps polling when a session read fails, instead of failing a commit that is still running', async () => {
		let polls = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: any) => {
				const url = String(input);
				if (url.endsWith('/versions/latest')) return json({ semver: '1.0.0' });
				if (url.endsWith('/versions/negotiate')) {
					return json({ session_id: 's1', needed_records: [], needed_files: [] });
				}
				if (url.includes('/commit')) return json({ session_id: 's1' }, 202);
				if (url.endsWith('/versions/negotiate/s1')) {
					polls += 1;
					// A 200 whose body is not JSON: `json()` throws, which reaches the poll loop's
					// catch directly. (Throwing from fetch instead would be absorbed by `request`'s
					// own retry, so it would never exercise this path.)
					if (polls <= 3) {
						return new Response('<html>502 upstream</html>', {
							status: 200,
							headers: { 'Content-Type': 'text/html' },
						});
					}
					return json({
						status: 'committed',
						result: { semver: '1.1.0', hash: 'h', recordCount: 1, fileCount: 0 },
					});
				}
				throw new Error(`unexpected ${url}`);
			}),
		);

		const result = await makeClient().push(payload(), '1.0.0', 'msg');
		expect(result).toMatchObject({ status: 'committed', semver: '1.1.0' });
		expect(polls).toBeGreaterThan(3);
	});

	it('reports which files could not be produced rather than a generic commit failure', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: any) => {
				const url = String(input);
				if (url.endsWith('/versions/latest')) return json({ semver: '1.0.0' });
				if (url.endsWith('/versions/negotiate')) {
					return json({ session_id: 's1', needed_records: [], needed_files: [] });
				}
				// Synchronous 422 naming a file the push cannot regenerate.
				if (url.includes('/commit')) {
					return json({ error: 'missing', filesNeeded: ['sha256:gone'] }, 422);
				}
				throw new Error(`unexpected ${url}`);
			}),
		);

		await expect(makeClient().push(payload(), '1.0.0', 'msg')).rejects.toThrow(
			/can no longer produce/,
		);
	});
});
