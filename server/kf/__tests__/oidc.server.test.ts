import { type MockInstance, vi } from 'vitest';

import { fetchUserOrgs, syncBanToKfAuth, syncUnbanToKfAuth } from '../oidc.server';

// Read when oidc.server loads (vi.hoisted runs before the imports)
vi.hoisted(() => {
	process.env.AUTH_INTERNAL_API_URL = 'http://kf-auth.test';
	process.env.OIDC_CLIENT_SECRET = 'test-client-secret';
});

const basic = `Basic ${Buffer.from('kf_pubpub:test-client-secret').toString('base64')}`;

let fetchSpy: MockInstance<typeof fetch>;

beforeEach(() => {
	fetchSpy = vi
		.spyOn(globalThis, 'fetch')
		.mockImplementation(
			async () => new Response(JSON.stringify({ ok: true, orgs: [] }), { status: 200 }),
		);
});

afterEach(() => {
	vi.restoreAllMocks();
});

afterAll(() => {
	delete process.env.AUTH_INTERNAL_API_URL;
	delete process.env.OIDC_CLIENT_SECRET;
});

const sent = () => {
	expect(fetchSpy).toHaveBeenCalledTimes(1);
	const [url, init] = fetchSpy.mock.calls[0];
	return { url: String(url), headers: (init?.headers ?? {}) as Record<string, string> };
};

describe('calls to KF as PubPub’s own client', () => {
	it.each([
		[
			'users.orgs',
			() => fetchUserOrgs('user-1'),
			'http://kf-auth.test/api/internal/users/user-1/orgs',
		],
		[
			'users.ban',
			() => syncBanToKfAuth('user-1'),
			'http://kf-auth.test/api/internal/users/user-1/ban',
		],
		[
			'users.ban (unban)',
			() => syncUnbanToKfAuth('user-1'),
			'http://kf-auth.test/api/internal/users/user-1/unban',
		],
	])('%s sends the client id and secret as Basic', async (_, call, expectedUrl) => {
		await call();
		const { url, headers } = sent();
		expect(url).toBe(expectedUrl);
		expect(headers.Authorization).toBe(basic);
		expect(JSON.stringify(headers)).not.toMatch(/Bearer/);
	});

	it('sends nothing without a client secret', async () => {
		vi.resetModules();
		delete process.env.OIDC_CLIENT_SECRET;
		try {
			const oidc = await import('../oidc.server');
			expect(oidc.kfClientAuthorization()).toBeNull();
			expect(await oidc.fetchUserOrgs('user-1')).toEqual([]);
			await oidc.syncBanToKfAuth('user-1');
			await oidc.syncUnbanToKfAuth('user-1');
			expect(fetchSpy).not.toHaveBeenCalled();
		} finally {
			process.env.OIDC_CLIENT_SECRET = 'test-client-secret';
		}
	});
});
