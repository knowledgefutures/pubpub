import uuid from 'uuid';

import { Community, Org, OrgFeaturedPub, OrgInvite, OrgMember } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

let orgA: Org;
let orgB: Org;

const host = 'www.pubpub.org';

const models = modelize`
	User orgAdmin {}
	User orgBAdmin {}
	User outsider {}
	Community invited {
		Member {
			permissions: "admin"
			User invitedAdmin {}
		}
	}
	Community requester {
		Member {
			permissions: "admin"
			User requesterAdmin {}
		}
	}
	Community mutual {
		Member {
			permissions: "admin"
			User mutualAdmin {}
		}
	}
	Community both {
		Member {
			permissions: "admin"
			User bothAdmin {}
		}
	}
	Community ownedByB {
		Member {
			permissions: "admin"
			User ownedByBAdmin {}
		}
	}
	Community contested {
		Member {
			permissions: "admin"
			User contestedAdmin {}
		}
	}
	Community featured {
		Pub featuredPub {}
	}
	Community switcher {}
	User switcherAdmin {}
`;

const createOrg = (title: string) =>
	Org.create({
		slug: `invite-org-${uuid.v4().slice(0, 8)}`,
		title,
		isActive: true,
		kfOrgId: 'kf-test-account',
	});

setup(beforeAll, async () => {
	await models.resolve();
	orgA = await createOrg('Org A');
	orgB = await createOrg('Org B');
	await OrgMember.bulkCreate([
		{ orgId: orgA.id, userId: models.orgAdmin.id, permissions: 'admin' },
		{ orgId: orgA.id, userId: models.bothAdmin.id, permissions: 'admin' },
		{ orgId: orgB.id, userId: models.orgBAdmin.id, permissions: 'admin' },
		{ orgId: orgA.id, userId: models.switcherAdmin.id, permissions: 'admin' },
	]);
	await Community.update({ orgId: orgB.id }, { where: { id: models.ownedByB.id } });
	await Community.update(
		{ orgId: orgA.id },
		{ where: { id: [models.featured.id, models.switcher.id] } },
	);
});
teardown(afterAll);

const orgIdOf = async (community: { id: string }) =>
	(await Community.findByPk(community.id))?.orgId ?? null;

const organization = (community: { id: string }) => `/api/communities/${community.id}/organization`;

describe('org invites', () => {
	it('lets an org invite a community, which a community admin accepts', async () => {
		const { body: invite } = await (await login(models.orgAdmin))
			.post(`/api/orgs/${orgA.id}/invites`)
			.set('Host', host)
			.send({ communityId: models.invited.id })
			.expect(201);
		expect(invite.status).toBe('pending');

		const { body: panel } = await (await login(models.invitedAdmin))
			.get(organization(models.invited))
			.set('Host', host)
			.expect(200);
		expect(panel.org).toBeNull();
		expect(panel.invites.map((i) => i.org.id)).toEqual([orgA.id]);

		await (await login(models.outsider))
			.post(`/api/orgInvites/${invite.invite.id}/accept`)
			.set('Host', host)
			.expect(403);
		await (await login(models.invitedAdmin))
			.post(`/api/orgInvites/${invite.invite.id}/accept`)
			.set('Host', host)
			.expect(200);
		expect(await orgIdOf(models.invited)).toBe(orgA.id);
		expect((await OrgInvite.findByPk(invite.invite.id))?.status).toBe('accepted');
	});

	it('lets a community ask to join, which an org admin declines', async () => {
		const { body } = await (await login(models.requesterAdmin))
			.post(organization(models.requester))
			.set('Host', host)
			.send({ orgSlug: orgA.slug })
			.expect(201);
		const { body: pending } = await (await login(models.orgAdmin))
			.get(`/api/orgs/${orgA.id}/invites`)
			.set('Host', host)
			.expect(200);
		expect(pending.requests.map((r) => r.community.id)).toContain(models.requester.id);

		await (await login(models.requesterAdmin))
			.post(`/api/orgInvites/${body.invite.id}/decline`)
			.set('Host', host)
			.expect(403);
		await (await login(models.orgAdmin))
			.post(`/api/orgInvites/${body.invite.id}/decline`)
			.set('Host', host)
			.expect(200);
		expect(await orgIdOf(models.requester)).toBeNull();
	});

	it('moves the community in when both sides have asked', async () => {
		await (await login(models.orgAdmin))
			.post(`/api/orgs/${orgA.id}/invites`)
			.set('Host', host)
			.send({ communityId: models.mutual.id })
			.expect(201);
		const { body } = await (await login(models.mutualAdmin))
			.post(organization(models.mutual))
			.set('Host', host)
			.send({ orgId: orgA.id })
			.expect(200);
		expect(body.status).toBe('joined');
		expect(await orgIdOf(models.mutual)).toBe(orgA.id);
	});

	it('moves the community in directly for an admin of both', async () => {
		const { body } = await (await login(models.bothAdmin))
			.post(organization(models.both))
			.set('Host', host)
			.send({ orgId: orgA.id })
			.expect(200);
		expect(body.status).toBe('joined');
		expect(await orgIdOf(models.both)).toBe(orgA.id);
	});

	it('does not invite a community another org owns', async () => {
		await (await login(models.orgAdmin))
			.post(`/api/orgs/${orgA.id}/invites`)
			.set('Host', host)
			.send({ communityId: models.ownedByB.id })
			.expect(400);
	});

	it('only lets an admin of the owning org move or release a community', async () => {
		await (await login(models.ownedByBAdmin))
			.post(organization(models.ownedByB))
			.set('Host', host)
			.send({ orgId: orgA.id })
			.expect(400);
		await (await login(models.ownedByBAdmin))
			.delete(organization(models.ownedByB))
			.set('Host', host)
			.expect(403);
		await (await login(models.orgBAdmin))
			.delete(organization(models.ownedByB))
			.set('Host', host)
			.expect(200);
		expect(await orgIdOf(models.ownedByB)).toBeNull();
	});

	it('lets only the asking side cancel, and closes rival invites on accept', async () => {
		const { body: fromA } = await (await login(models.orgAdmin))
			.post(`/api/orgs/${orgA.id}/invites`)
			.set('Host', host)
			.send({ communityId: models.contested.id })
			.expect(201);
		const { body: fromB } = await (await login(models.orgBAdmin))
			.post(`/api/orgs/${orgB.id}/invites`)
			.set('Host', host)
			.send({ communityId: models.contested.id })
			.expect(201);

		await (await login(models.contestedAdmin))
			.post(`/api/orgInvites/${fromA.invite.id}/cancel`)
			.set('Host', host)
			.expect(403);

		await (await login(models.contestedAdmin))
			.post(`/api/orgInvites/${fromB.invite.id}/accept`)
			.set('Host', host)
			.expect(200);
		expect(await orgIdOf(models.contested)).toBe(orgB.id);
		expect((await OrgInvite.findByPk(fromA.invite.id))?.status).toBe('cancelled');

		await (await login(models.orgAdmin))
			.post(`/api/orgInvites/${fromA.invite.id}/accept`)
			.set('Host', host)
			.expect(400);
	});

	it("stops featuring a community's pubs once it leaves the org", async () => {
		await OrgFeaturedPub.create({ orgId: orgA.id, pubId: models.featuredPub.id });
		await (await login(models.orgAdmin))
			.delete(organization(models.featured))
			.set('Host', host)
			.expect(200);
		expect(await OrgFeaturedPub.count({ where: { pubId: models.featuredPub.id } })).toBe(0);
	});

	it('drops a request to switch orgs once the asker can no longer move the community', async () => {
		const { body } = await (await login(models.switcherAdmin))
			.post(organization(models.switcher))
			.set('Host', host)
			.send({ orgId: orgB.id })
			.expect(201);
		await OrgMember.destroy({ where: { orgId: orgA.id, userId: models.switcherAdmin.id } });

		await (await login(models.orgBAdmin))
			.post(`/api/orgInvites/${body.invite.id}/accept`)
			.set('Host', host)
			.expect(400);
		expect(await orgIdOf(models.switcher)).toBe(orgA.id);
	});
});
