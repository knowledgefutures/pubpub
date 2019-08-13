/* global describe, it, expect, beforeAll, afterAll */
import { makeUser, makeCommunity, setup, teardown, login } from '../../../stubstub';
import { createBranchPermission } from '../queries';
import { Pub, Branch, BranchPermission } from '../../models';
import { createPub } from '../../pub/queries';

let testCommunity;
let pubManager;
let unrelatedUser;
let blessedUser;
let pub;
let draftBranch;

setup(beforeAll, async () => {
	testCommunity = await makeCommunity();
	pubManager = await makeUser();
	unrelatedUser = await makeUser();
	blessedUser = await makeUser();
	const { id: pubId } = await createPub({ communityId: testCommunity.community.id }, pubManager);
	pub = await Pub.findOne({ where: { id: pubId }, include: [{ model: Branch, as: 'branches' }] });
	draftBranch = pub.branches.find((br) => br.title === 'draft');
});

describe('/api/branchPermissions', () => {
	it('lets pub managers creates a BranchPermission', async () => {
		const { community } = testCommunity;
		await BranchPermission.destroy({ where: { userId: unrelatedUser.id } });
		await draftBranch.update({ pubManagerPermissions: 'manage' });
		const agent = await login(pubManager);
		await agent
			.post('/api/branchPermissions')
			.send({
				communityId: community.id,
				userId: unrelatedUser.id,
				pubId: pub.id,
				branchId: draftBranch.id,
			})
			.expect(201);
		const bp = await BranchPermission.findOne({ where: { userId: unrelatedUser.id } });
		expect(bp.pubId).toEqual(pub.id);
		expect(bp.permissions).toEqual('view');
	});

	it('does not let pub managers creates a BranchPermission if the branch does not allow it', async () => {
		const { community } = testCommunity;
		await draftBranch.update({ pubManagerPermissions: 'none' });
		const agent = await login(pubManager);
		await agent
			.post('/api/branchPermissions')
			.send({
				communityId: community.id,
				userId: unrelatedUser.id,
				pubId: pub.id,
				branchId: draftBranch.id,
			})
			.expect(403);
	});

	it('lets community admins creates a BranchPermission', async () => {
		const { admin, community } = testCommunity;
		await BranchPermission.destroy({ where: { userId: unrelatedUser.id } });
		await draftBranch.update({ communityAdminPermissions: 'manage' });
		const agent = await login(admin);
		await agent
			.post('/api/branchPermissions')
			.send({
				communityId: community.id,
				userId: unrelatedUser.id,
				pubId: pub.id,
				branchId: draftBranch.id,
			})
			.expect(201);
		const bp = await BranchPermission.findOne({ where: { userId: unrelatedUser.id } });
		expect(bp.pubId).toEqual(pub.id);
		expect(bp.permissions).toEqual('view');
	});

	it('does not let community admins creates a BranchPermission if the branch does not allow it', async () => {
		const { admin, community } = testCommunity;
		await draftBranch.update({ communityAdminPermissions: 'none' });
		const agent = await login(admin);
		await agent
			.post('/api/branchPermissions')
			.send({
				communityId: community.id,
				userId: unrelatedUser.id,
				pubId: pub.id,
				branchId: draftBranch.id,
			})
			.expect(403);
	});

	it('lets users with a "manage" BranchPermission add more branch permissions', async () => {
		const { community } = testCommunity;
		await BranchPermission.destroy({ where: { userId: unrelatedUser.id } });
		await createBranchPermission({
			userId: blessedUser.id,
			pubId: pub.id,
			branchId: draftBranch.id,
			permissions: 'manage',
		});
		const agent = await login(blessedUser);
		await agent
			.post('/api/branchPermissions')
			.send({
				communityId: community.id,
				userId: unrelatedUser.id,
				pubId: pub.id,
				branchId: draftBranch.id,
			})
			.expect(201);
		const bp = await BranchPermission.findOne({ where: { userId: unrelatedUser.id } });
		expect(bp.pubId).toEqual(pub.id);
		expect(bp.permissions).toEqual('view');
	});

	it('updates a BranchPermission', async () => {
		const { community } = testCommunity;
		await BranchPermission.destroy({ where: { userId: blessedUser.id } });
		await draftBranch.update({ pubManagerPermissions: 'manage' });
		const bp = await createBranchPermission({
			userId: blessedUser.id,
			pubId: pub.id,
			branchId: draftBranch.id,
		});
		expect(bp.permissions).toEqual('view');
		const agent = await login(pubManager);
		await agent
			.put('/api/branchPermissions')
			.send({
				communityId: community.id,
				pubId: pub.id,
				branchId: draftBranch.id,
				branchPermissionId: bp.id,
				permissions: 'manage',
			})
			.expect(200);
		const bpNow = await BranchPermission.findOne({ where: { id: bp.id } });
		expect(bpNow.permissions).toEqual('manage');
	});

	it('destroys a BranchPermission', async () => {
		const { community } = testCommunity;
		await BranchPermission.destroy({ where: { userId: blessedUser.id } });
		await draftBranch.update({ pubManagerPermissions: 'manage' });
		const bp = await createBranchPermission({
			userId: blessedUser.id,
			pubId: pub.id,
			branchId: draftBranch.id,
		});
		const agent = await login(pubManager);
		await agent
			.delete('/api/branchPermissions')
			.send({
				communityId: community.id,
				pubId: pub.id,
				branchId: draftBranch.id,
				branchPermissionId: bp.id,
				permissions: 'manage',
			})
			.expect(200);
		const bpNow = await BranchPermission.findOne({ where: { id: bp.id } });
		expect(bpNow).toEqual(null);
	});
});

teardown(afterAll);
