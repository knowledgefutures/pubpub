import { vi } from 'vitest';

import { login, modelize, setup, teardown } from 'stubstub';

vi.mock('../queries', () => ({
	getUploadPolicy: vi.fn(() => ({
		acl: 'public-read',
		awsAccessKeyId: 'id',
		policy: 'policy',
		signature: 'signature',
		bucket: 'assets.pubpub.org',
	})),
}));

const models = modelize`
	User user {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

describe('GET /api/uploadPolicy', () => {
	const ownKey = () => `c1/u${models.user.id}/a-1.png`;

	it('rejects requests without a session', async () => {
		const agent = await login();
		await agent
			.get('/api/uploadPolicy')
			.query({ contentType: 'image/png', key: ownKey() })
			.expect(403);
	});

	it('returns a policy for a key under the user', async () => {
		const agent = await login(models.user);
		const { body } = await agent
			.get('/api/uploadPolicy')
			.query({ contentType: 'image/png', key: ownKey() })
			.expect(200);
		expect(body.bucket).toBe('assets.pubpub.org');
	});

	it('rejects a missing key', async () => {
		const agent = await login(models.user);
		await agent.get('/api/uploadPolicy').query({ contentType: 'image/png' }).expect(400);
	});

	it.each(['c1/uother/a-1.png', 'abcd1234/a.html'])('rejects the key %s', async (key) => {
		const agent = await login(models.user);
		await agent.get('/api/uploadPolicy').query({ contentType: 'text/html', key }).expect(400);
	});

	it('rejects a partial content type', async () => {
		const agent = await login(models.user);
		await agent
			.get('/api/uploadPolicy')
			.query({ contentType: 'text/', key: ownKey() })
			.expect(400);
	});
});
