import uuid from 'uuid';

import { Community, Org, OrgMember } from 'server/models';
import { getMembers, getScope } from 'server/utils/queryHelpers';
import { login, modelize, setup, teardown } from 'stubstub';

let org: Org;

const models = modelize`
	User orgViewer {}
	User orgEditor {}
	User orgManager {}
	User outsider {}
	Community ownedCommunity {
		Member {
			permissions: "admin"
			User directAdmin {}
		}
	}
	Community otherCommunity {}
`;

setup(beforeAll, async () => {
	await models.resolve();
	org = await Org.create({
		slug: `inherit-org-${uuid.v4().slice(0, 8)}`,
		title: 'Inherit Org',
		isActive: true,
		kfOrgId: 'kf-test-account',
	});
	await OrgMember.bulkCreate([
		{ orgId: org.id, userId: models.orgViewer.id, permissions: 'view' },
		{ orgId: org.id, userId: models.orgEditor.id, permissions: 'edit' },
		{ orgId: org.id, userId: models.orgManager.id, permissions: 'manage' },
		// Lower than their direct admin membership, which must win
		{ orgId: org.id, userId: models.directAdmin.id, permissions: 'view' },
	]);
	await Community.update({ orgId: org.id }, { where: { id: models.ownedCommunity.id } });
});
teardown(afterAll);

const scopeFor = (user: { id: string }, community: { id: string }) =>
	getScope({ communityId: community.id, loginId: user.id });

describe('inherited org permissions', () => {
	it('gives an org member their org level in an owned community', async () => {
		const viewer = await scopeFor(models.orgViewer, models.ownedCommunity);
		expect(viewer.activePermissions.canViewCommunity).toBe(true);
		expect(viewer.activePermissions.canEditCommunity).toBe(false);

		const manager = await scopeFor(models.orgManager, models.ownedCommunity);
		expect(manager.activePermissions.canManageCommunity).toBe(true);
		expect(manager.activePermissions.canAdminCommunity).toBe(false);
	});

	it('tags the inherited member with its org', async () => {
		const { memberData } = await scopeFor(models.orgEditor, models.ownedCommunity);
		expect(memberData).toHaveLength(1);
		expect(memberData[0]).toMatchObject({
			communityId: models.ownedCommunity.id,
			permissions: 'edit',
			inheritedFromOrg: { id: org.id, slug: org.slug, title: 'Inherit Org' },
		});
	});

	it('keeps the higher of a direct membership and an org membership', async () => {
		const scope = await scopeFor(models.directAdmin, models.ownedCommunity);
		expect(scope.activePermissions.canAdminCommunity).toBe(true);
	});

	it('gives nothing in a community the org does not own', async () => {
		const scope = await scopeFor(models.orgManager, models.otherCommunity);
		expect(scope.memberData).toHaveLength(0);
		expect(scope.activePermissions.canViewCommunity).toBe(false);
	});

	it('gives nothing to users outside the org', async () => {
		const scope = await scopeFor(models.outsider, models.ownedCommunity);
		expect(scope.memberData).toHaveLength(0);
		expect(scope.activePermissions.canViewCommunity).toBe(false);
	});

	it('applies the inherited level to community routes', async () => {
		const host = `${models.ownedCommunity.subdomain}.pubpub.org`;
		await (await login(models.orgViewer)).get('/dash/members').set('Host', host).expect(200);
		await (await login(models.outsider)).get('/dash/members').set('Host', host).expect(404);

		await (await login(models.orgEditor))
			.put('/api/communities')
			.send({ communityId: models.ownedCommunity.id, title: 'Editors cannot' })
			.expect(403);
		await (await login(models.orgManager))
			.put('/api/communities')
			.send({ communityId: models.ownedCommunity.id, title: 'Managers can' })
			.expect(200);
		const community = await Community.findByPk(models.ownedCommunity.id);
		expect(community?.title).toBe('Managers can');
	});

	it('lists org members with the community members, via the org', async () => {
		const scopeData = await scopeFor(models.directAdmin, models.ownedCommunity);
		const { members, orgMembers, org: owningOrg } = await getMembers({ scopeData });
		expect(members.map((m) => m.userId)).toEqual([models.directAdmin.id]);
		expect(owningOrg).toMatchObject({ id: org.id, slug: org.slug, title: 'Inherit Org' });
		const levels = Object.fromEntries(orgMembers.map((m) => [m.userId, m.permissions]));
		expect(levels[models.orgManager.id]).toBe('manage');
		expect(orgMembers.every((m) => m.user?.id === m.userId)).toBe(true);
	});
});
