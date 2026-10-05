import { vi } from 'vitest';

import { Community } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

const { fetchUserOrgs } = vi.hoisted(() => {
	// server/kf/api reads the key at import time; it is unset again in setup so that
	// test logins take the legacy local path instead of calling kf-auth.
	process.env.AUTH_INTERNAL_API_KEY = 'test-internal-key';
	return { fetchUserOrgs: vi.fn(async () => [] as { id: string }[]) };
});

const models = modelize`
	Community billedCommunity {
		kfAccountId: "account-summary"
	}
	Community transferredCommunity {
		Member {
			permissions: "admin"
			User admin {}
		}
	}
`;

setup(beforeAll, async () => {
	vi.mock('server/kf/oidc.server', async (importOriginal) => ({
		...(await importOriginal<typeof import('server/kf/oidc.server')>()),
		fetchUserOrgs,
	}));
	delete process.env.AUTH_INTERNAL_API_KEY;
	await models.resolve();
});

const bearer = 'Bearer test-internal-key';

describe('/api/kf/summary', () => {
	it('lists communities billed to the kf_account_id', async () => {
		const agent = await login();
		const { body } = await agent
			.get('/api/kf/summary?kf_account_id=account-summary')
			.set('Authorization', bearer)
			.expect(200);
		expect(body.accounts.map((a) => a.id)).toEqual([models.billedCommunity.id]);
	});

	it('still accepts the old kf_org_id parameter', async () => {
		const agent = await login();
		const { body } = await agent
			.get('/api/kf/summary?kf_org_id=account-summary')
			.set('Authorization', bearer)
			.expect(200);
		expect(body.accounts.map((a) => a.id)).toEqual([models.billedCommunity.id]);
	});

	it('requires an account id', async () => {
		const agent = await login();
		await agent.get('/api/kf/summary').set('Authorization', bearer).expect(400);
	});
});

describe('/api/kf/transfer-community', () => {
	it('moves a community to an account the user belongs to, under either field name', async () => {
		const { admin, transferredCommunity } = models;
		const agent = await login(admin);
		fetchUserOrgs.mockResolvedValue([{ id: 'account-a' }, { id: 'account-b' }]);

		await agent
			.post('/api/kf/transfer-community')
			.send({ communityId: transferredCommunity.id, kfAccountId: 'account-a' })
			.expect(200);
		expect((await Community.findByPk(transferredCommunity.id))?.kfAccountId).toEqual(
			'account-a',
		);

		await agent
			.post('/api/kf/transfer-community')
			.send({ communityId: transferredCommunity.id, kfOrgId: 'account-b' })
			.expect(200);
		expect((await Community.findByPk(transferredCommunity.id))?.kfAccountId).toEqual(
			'account-b',
		);

		await agent
			.post('/api/kf/transfer-community')
			.send({ communityId: transferredCommunity.id, kfAccountId: 'account-other' })
			.expect(403);
	});
});

teardown(afterAll);
