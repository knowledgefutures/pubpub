import uuid from 'uuid';

import { Community, CommunityTemplate, Org, OrgFeaturedPub, OrgMember } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

let org: Org;

const models = modelize`
	User superAdmin {
		isSuperAdmin: true
	}
	User orgAdmin {}
	User orgViewer {}
	User regularUser {}
	Community ownedCommunity {
		Pub ownedPub {}
	}
	Community otherCommunity {
		Pub otherPub {}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
	org = await Org.create({
		slug: `route-org-${uuid.v4().slice(0, 8)}`,
		title: 'Route Org',
		isActive: true,
		communityCreationEnabled: true,
		kfOrgId: 'kf-test-account',
	});
	await OrgMember.create({ orgId: org.id, userId: models.orgAdmin.id, permissions: 'admin' });
	await OrgMember.create({ orgId: org.id, userId: models.orgViewer.id, permissions: 'view' });
	await Community.update({ orgId: org.id }, { where: { id: models.ownedCommunity.id } });
	await CommunityTemplate.create({
		slug: `route-tpl-${uuid.v4().slice(0, 8)}`,
		title: 'Route Org Template',
		isActive: true,
		orgId: org.id,
	});
});
teardown(afterAll);

const host = 'www.pubpub.org';

describe('org pages', () => {
	it('serves the landing page and dashboard to superadmins and org members', async () => {
		await Promise.all(
			[models.superAdmin, models.orgAdmin, models.orgViewer].map(async (user) => {
				const agent = await login(user);
				await agent.get(`/org/${org.slug}`).set('Host', host).expect(200);
				await agent.get(`/org/${org.slug}/data`).set('Host', host).expect(200);
			}),
		);
	});

	it('hides org pages from other users during the private rollout', async () => {
		const agent = await login(models.regularUser);
		await agent.get(`/org/${org.slug}`).set('Host', host).expect(404);
		await agent.get(`/org/${org.slug}/data`).set('Host', host).expect(404);
		await (await login()).get(`/org/${org.slug}`).set('Host', host).expect(404);
	});

	it('serves the directory and the superadmin Orgs tab to superadmins', async () => {
		const agent = await login(models.superAdmin);
		await agent.get('/orgs').set('Host', host).expect(200);
		await agent.get('/superadmin/orgs').set('Host', host).expect(200);
	});

	it('offers the org templates on community create', async () => {
		const agent = await login(models.orgAdmin);
		const { text } = await agent
			.get(`/community/create?org=${org.slug}`)
			.set('Host', host)
			.expect(200);
		expect(text).toContain('Route Org Template');
	});

	it('lists the owned communities and reports the viewer level on the dashboard', async () => {
		const agent = await login(models.orgViewer);
		const { body: communities } = await agent
			.get(`/api/orgs/${org.id}/communities`)
			.set('Host', host)
			.expect(200);
		expect(communities.map((c) => c.id)).toEqual([models.ownedCommunity.id]);
		const { body: data } = await agent
			.get(`/api/orgs/slug/${org.slug}/data`)
			.set('Host', host)
			.expect(200);
		expect(data.viewerPermissions).toEqual('view');
		expect(data.communities.map((c) => c.id)).toEqual([models.ownedCommunity.id]);
	});
});

describe('org members', () => {
	it('lists members with their levels', async () => {
		const agent = await login(models.orgViewer);
		const { body } = await agent
			.get(`/api/orgs/${org.id}/members`)
			.set('Host', host)
			.expect(200);
		const levels = Object.fromEntries(body.map((m) => [m.userId, m.permissions]));
		expect(levels[models.orgAdmin.id]).toEqual('admin');
		expect(levels[models.orgViewer.id]).toEqual('view');
	});

	it('lets only admins add members and change levels', async () => {
		await (await login(models.orgViewer))
			.post(`/api/orgs/${org.id}/members`)
			.set('Host', host)
			.send({ userId: models.regularUser.id, permissions: 'edit' })
			.expect(403);
		const agent = await login(models.orgAdmin);
		await agent
			.post(`/api/orgs/${org.id}/members`)
			.set('Host', host)
			.send({ userId: models.regularUser.id, permissions: 'edit' })
			.expect(201);
		await agent
			.post(`/api/orgs/${org.id}/members`)
			.set('Host', host)
			.send({ userId: models.regularUser.id, permissions: 'manage' })
			.expect(201);
		const member = await OrgMember.findOne({
			where: { orgId: org.id, userId: models.regularUser.id },
		});
		expect(member?.permissions).toEqual('manage');
		await agent
			.delete(`/api/orgs/${org.id}/members/${models.regularUser.id}`)
			.set('Host', host)
			.expect(200);
	});

	it('keeps at least one admin', async () => {
		const agent = await login(models.orgAdmin);
		await agent
			.delete(`/api/orgs/${org.id}/members/${models.orgAdmin.id}`)
			.set('Host', host)
			.expect(400);
		await agent
			.post(`/api/orgs/${org.id}/members`)
			.set('Host', host)
			.send({ userId: models.orgAdmin.id, permissions: 'view' })
			.expect(400);
	});
});

describe('org ownership', () => {
	it('lets only superadmins give a community to an org', async () => {
		await (await login(models.orgAdmin))
			.post(`/api/orgs/${org.id}/communities`)
			.set('Host', host)
			.send({ communityId: models.otherCommunity.id })
			.expect(403);
		await (await login(models.superAdmin))
			.post(`/api/orgs/${org.id}/communities`)
			.set('Host', host)
			.send({ communityId: models.otherCommunity.id })
			.expect(201);
		const community = await Community.findByPk(models.otherCommunity.id);
		expect(community?.orgId).toEqual(org.id);
	});

	it('lets org admins release a community', async () => {
		await (await login(models.orgViewer))
			.delete(`/api/orgs/${org.id}/communities/${models.otherCommunity.id}`)
			.set('Host', host)
			.expect(403);
		await (await login(models.orgAdmin))
			.delete(`/api/orgs/${org.id}/communities/${models.otherCommunity.id}`)
			.set('Host', host)
			.expect(200);
		const community = await Community.findByPk(models.otherCommunity.id);
		expect(community?.orgId).toBeNull();
	});

	it('features only pubs from owned communities', async () => {
		const agent = await login(models.orgAdmin);
		await agent
			.post(`/api/orgs/${org.id}/pubs`)
			.set('Host', host)
			.send({ pubId: models.otherPub.id })
			.expect(400);
		await agent
			.post(`/api/orgs/${org.id}/pubs`)
			.set('Host', host)
			.send({ pubId: models.ownedPub.id })
			.expect(201);
		expect(await OrgFeaturedPub.count({ where: { orgId: org.id } })).toEqual(1);
	});

	it('requires a KF Account to create an org', async () => {
		const agent = await login(models.superAdmin);
		const slug = `kf-required-${uuid.v4().slice(0, 8)}`;
		await agent.post('/api/orgs').set('Host', host).send({ slug, title: 'No KF' }).expect(400);
		await agent
			.post('/api/orgs')
			.set('Host', host)
			.send({ slug, title: 'With KF', kfOrgId: 'kf-test-account' })
			.expect(201);
	});
});
