import uuid from 'uuid';
import { vi } from 'vitest';

import { Org, OrgMember } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

vi.mock('server/kf/oidc.server', async (importOriginal) => ({
	...(await importOriginal<typeof import('server/kf/oidc.server')>()),
	fetchUserOrgs: vi.fn(async () => [
		{ id: 'kf-mine', name: 'Mine', slug: 'mine', type: 'shared', role: 'admin' },
	]),
}));

let org: Org;

const models = modelize`
	User orgAdmin {}
	User orgViewer {}
`;

setup(beforeAll, async () => {
	await models.resolve();
	org = await Org.create({
		slug: `kf-swap-${uuid.v4().slice(0, 8)}`,
		title: 'Swap Org',
		kfOrgId: 'kf-original',
	});
	await OrgMember.create({ orgId: org.id, userId: models.orgAdmin.id, permissions: 'admin' });
	await OrgMember.create({ orgId: org.id, userId: models.orgViewer.id, permissions: 'view' });
});
teardown(afterAll);

const host = 'www.pubpub.org';

describe('swapping the KF Account', () => {
	it('lets an org admin move the org only to a KF Account they belong to', async () => {
		const agent = await login(models.orgAdmin);
		const { body } = await agent
			.get(`/api/orgs/${org.id}/kf-accounts`)
			.set('Host', host)
			.expect(200);
		expect(body.current).toBe('kf-original');
		expect(body.accounts.map((a) => a.id)).toEqual(['kf-mine']);

		await agent
			.put(`/api/orgs/${org.id}`)
			.set('Host', host)
			.send({ kfOrgId: 'kf-not-mine' })
			.expect(403);
		await agent
			.put(`/api/orgs/${org.id}`)
			.set('Host', host)
			.send({ kfOrgId: 'kf-mine' })
			.expect(200);
		expect((await Org.findByPk(org.id))?.kfOrgId).toBe('kf-mine');
	});

	it('keeps other members out', async () => {
		const agent = await login(models.orgViewer);
		await agent.get(`/api/orgs/${org.id}/kf-accounts`).set('Host', host).expect(403);
		await agent
			.put(`/api/orgs/${org.id}`)
			.set('Host', host)
			.send({ kfOrgId: 'kf-mine' })
			.expect(403);
	});
});
