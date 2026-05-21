import supertest from 'supertest';
import { vi } from 'vitest';

import { SpamTag, User } from 'server/models';
import { modelize, setup, teardown } from 'stubstub';

import { __appImmutableListenOnly } from '../../server';

const normalEmail = `${crypto.randomUUID()}@email.com`;
const restrictedEmail = `${crypto.randomUUID()}@email.com`;

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User legacyUser {
				email: ${normalEmail}
			}
		}
		Member {
			permissions: "admin"
			User restrictedUser {
				email: ${restrictedEmail}
			}
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

const AUTH_URL = 'http://kf-auth.test';
const AUTH_KEY = 'test-internal-key';
const ENDPOINT = '/api/internal/legacy-pubpub-login';

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

beforeEach(() => {
	vi.stubEnv('AUTH_INTERNAL_API_URL', AUTH_URL);
	vi.stubEnv('AUTH_INTERNAL_API_KEY', AUTH_KEY);
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe('/api/login (kf-auth handshake)', () => {
	it('verifies via the internal endpoint and establishes a PubPub session', async () => {
		const { legacyUser } = models;
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
			if (String(url).endsWith(ENDPOINT)) {
				return jsonResponse({ verified: true, userId: legacyUser.id });
			}
			throw new Error(`Unexpected fetch: ${url}`);
		});

		const server = __appImmutableListenOnly.listen();
		try {
			const res = await supertest(server)
				.post('/api/login')
				.send({ email: legacyUser.email, password: 'sha3-hex-payload' })
				.expect(201);

			expect(res.headers.deprecation).toBe('true');
			expect(res.headers.sunset).toBeTruthy();
			const cookies = (res.headers['set-cookie'] as unknown as string[]) ?? [];
			expect(cookies.some((c) => c.startsWith('connect.sid='))).toBe(true);
			expect(cookies.some((c) => c.startsWith('pp-lic='))).toBe(true);

			const call = fetchSpy.mock.calls.find(([u]) => String(u).endsWith(ENDPOINT));
			expect(call).toBeDefined();
			const init = call![1] as RequestInit;
			expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${AUTH_KEY}`);
			const body = JSON.parse(String(init.body));
			expect(body).toEqual({ email: legacyUser.email, prehashedPassword: 'sha3-hex-payload' });
		} finally {
			server.close();
		}
	});

	it('returns 401 when kf-auth reports verified:false (wrong password or unknown user)', async () => {
		const { legacyUser } = models;
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ verified: false }));

		const server = __appImmutableListenOnly.listen();
		try {
			const res = await supertest(server)
				.post('/api/login')
				.send({ email: legacyUser.email, password: 'sha3-wrong' })
				.expect(401);
			expect(res.body).toBe('Login attempt failed');
		} finally {
			server.close();
		}
	});

	it('returns 410 when kf-auth reports the hash has been migrated past pubpub-format', async () => {
		const { legacyUser } = models;
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ migrated: true }, 410));

		const server = __appImmutableListenOnly.listen();
		try {
			const res = await supertest(server)
				.post('/api/login')
				.send({ email: legacyUser.email, password: 'sha3-hex' })
				.expect(410);
			expect(res.text).toMatch(/API token/i);
		} finally {
			server.close();
		}
	});

	it('returns 403 when the local PubPub account is flagged as confirmed spam', async () => {
		const { restrictedUser } = models;
		const tag = await SpamTag.create({
			userId: restrictedUser.id,
			status: 'confirmed-spam',
			spamScore: 100,
			spamScoreComputedAt: new Date(),
			fields: { manuallyMarkedBy: [] },
		} as any);
		await User.update({ spamTagId: tag.id }, { where: { id: restrictedUser.id } });

		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			jsonResponse({ verified: true, userId: restrictedUser.id }),
		);

		const server = __appImmutableListenOnly.listen();
		try {
			const res = await supertest(server)
				.post('/api/login')
				.send({ email: restrictedUser.email, password: 'sha3-hex' })
				.expect(403);
			expect(res.text).toMatch(/restricted/i);
		} finally {
			server.close();
		}
	});

	it('auto-creates the local PubPub user when kf-auth returns an unknown id', async () => {
		const newId = crypto.randomUUID();
		const newEmail = `${crypto.randomUUID()}@auto.created`;
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			jsonResponse({ verified: true, userId: newId }),
		);

		const before = await User.findOne({ where: { id: newId } });
		expect(before).toBeNull();

		const server = __appImmutableListenOnly.listen();
		try {
			await supertest(server)
				.post('/api/login')
				.send({ email: newEmail, password: 'sha3-hex' })
				.expect(201);
		} finally {
			server.close();
		}

		const after = await User.findOne({ where: { id: newId } });
		expect(after).not.toBeNull();
		expect(after!.email).toBe(newEmail);
	});
});
