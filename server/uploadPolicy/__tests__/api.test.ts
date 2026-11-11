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
	it('rejects requests without a session', async () => {
		const agent = await login();
		await agent
			.get('/api/uploadPolicy')
			.query({ contentType: 'image/png', key: 'a/b.png' })
			.expect(403);
	});

	it('returns a policy for a signed-in user', async () => {
		const agent = await login(models.user);
		const { body } = await agent
			.get('/api/uploadPolicy')
			.query({ contentType: 'image/png', key: 'a/b.png' })
			.expect(200);
		expect(body.bucket).toBe('assets.pubpub.org');
	});
});
