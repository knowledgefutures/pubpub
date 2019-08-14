/* global describe, it, expect, beforeAll, afterAll */
import sinon from 'sinon';

import { makeUser, makeCommunity, setup, teardown, login } from '../../../stubstub';
import { createBranch } from '../queries';
import { Pub, Branch, BranchPermission } from '../../models';
import { createPub } from '../../pub/queries';
import * as firebaseAdmin from '../../utils/firebaseAdmin';

let firebaseAdminStub;
let testCommunity;
let pubManager;
let unrelatedUser;
let pub;

setup(beforeAll, async () => {
	firebaseAdminStub = sinon.stub(firebaseAdmin, 'createFirebaseBranch');
	testCommunity = await makeCommunity();
	pubManager = await makeUser();
	unrelatedUser = await makeUser();
	const { id: pubId } = await createPub({ communityId: testCommunity.community.id }, pubManager);
	pub = await Pub.findOne({ where: { id: pubId }, include: [{ model: Branch, as: 'branches' }] });
});

describe('/api/branches', () => {
	it('does not let a logged-out user create a branch', async () => {
		const { community } = testCommunity;
		const agent = await login();
		await agent
			.post('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				title: 'test-branch',
				userPermissions: [],
			})
			.expect(403);
	});

	it('lets any logged-in user create a branch', async () => {
		const { community } = testCommunity;
		const agent = await login(unrelatedUser);
		const {
			body: { id: branchId },
		} = await agent
			.post('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				title: 'test-branch',
				userPermissions: [],
			})
			.expect(201);
		const branch = await Branch.findOne({
			where: { id: branchId },
			include: [{ model: BranchPermission, as: 'permissions' }],
		});
		expect(branch.title).toEqual('test-branch');
		expect(branch.permissions.length).toEqual(1);
		expect(branch.permissions[0].userId).toEqual(unrelatedUser.id);
	});

	it('lets a Pub manager update branches if the appropriate permissions are set', async () => {
		const { community } = testCommunity;
		// A branch created by a user without any association to the pub
		const branch = await createBranch(
			{
				pubId: pub.id,
				title: 'hey-a-test-branch',
				pubManagerPermissions: 'manage',
				userPermissions: [],
			},
			unrelatedUser.id,
		);
		const agent = await login(pubManager);
		await agent
			.put('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				branchId: branch.id,
				title: 'renamed-branch',
			})
			.expect(200);
		const branchNow = await Branch.findOne({ where: { id: branch.id } });
		expect(branchNow.title).toEqual('renamed-branch');
	});

	it('does not let a Pub manager update branches if the appropriate permissions are not set', async () => {
		const { community } = testCommunity;
		// A branch created by a user without any association to the pub
		const branch = await createBranch(
			{
				pubId: pub.id,
				title: 'hey-a-test-branch',
				pubManagerPermissions: 'none',
				userPermissions: [],
			},
			unrelatedUser.id,
		);
		const agent = await login(pubManager);
		await agent
			.put('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				branchId: branch.id,
				title: 'renamed-branch',
			})
			.expect(403);
		const branchNow = await Branch.findOne({ where: { id: branch.id } });
		expect(branchNow.title).toEqual('hey-a-test-branch');
	});

	it('lets a community admin update branches if the appropriate permissions are set', async () => {
		const { admin, community } = testCommunity;
		// A branch created by a user without any association to the pub
		const branch = await createBranch(
			{
				pubId: pub.id,
				title: 'hey-another-test-branch',
				communityAdminPermissions: 'manage',
				userPermissions: [],
			},
			unrelatedUser.id,
		);
		const agent = await login(admin);
		await agent
			.put('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				branchId: branch.id,
				title: 'another-renamed-branch',
			})
			.expect(200);
		const branchNow = await Branch.findOne({ where: { id: branch.id } });
		expect(branchNow.title).toEqual('another-renamed-branch');
	});

	it('does not let a community admin update branches if the appropriate permissions not are set', async () => {
		const { admin, community } = testCommunity;
		// A branch created by a user without any association to the pub
		const branch = await createBranch(
			{
				pubId: pub.id,
				title: 'hey-another-test-branch',
				communityAdminPermissions: 'none',
				userPermissions: [],
			},
			unrelatedUser.id,
		);
		const agent = await login(admin);
		await agent
			.put('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				branchId: branch.id,
				title: 'another-renamed-branch',
			})
			.expect(403);
		const branchNow = await Branch.findOne({ where: { id: branch.id } });
		expect(branchNow.title).toEqual('hey-another-test-branch');
	});

	it('lets someone granted branch management permissions update a branch', async () => {
		const { community } = testCommunity;
		const branch = await createBranch(
			{
				pubId: pub.id,
				title: 'my-branch-unchanged',
				communityAdminPermissions: 'none',
				userPermissions: [{ user: { id: unrelatedUser.id }, permissions: 'manage' }],
			},
			pubManager.id,
		);
		const agent = await login(unrelatedUser);
		await agent
			.put('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				branchId: branch.id,
				title: 'my-branch-changed',
			})
			.expect(200);
		const branchNow = await Branch.findOne({ where: { id: branch.id } });
		expect(branchNow.title).toEqual('my-branch-changed');
	});

	it('does not let some rando without permissions update a branch', async () => {
		const { community } = testCommunity;
		const branch = await createBranch(
			{
				pubId: pub.id,
				title: 'my-next-branch-unchanged',
				communityAdminPermissions: 'none',
				userPermissions: [],
			},
			pubManager.id,
		);
		const agent = await login(unrelatedUser);
		await agent
			.put('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				branchId: branch.id,
				title: 'i-am-hacking-your-branch',
			})
			.expect(403);
		const branchNow = await Branch.findOne({ where: { id: branch.id } });
		expect(branchNow.title).toEqual('my-next-branch-unchanged');
	});

	it('lets someone with management permissions destroy a branch', async () => {
		const { community } = testCommunity;
		const branch = await createBranch(
			{
				pubId: pub.id,
				title: 'an-ephemeral-branch',
				communityAdminPermissions: 'none',
				userPermissions: [],
			},
			pubManager.id,
		);
		const agent = await login(pubManager);
		await agent
			.delete('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				branchId: branch.id,
			})
			.expect(200);
		const branchNow = await Branch.findOne({ where: { id: branch.id } });
		expect(branchNow).toEqual(null);
	});

	it('does not let some rando destroy a branch', async () => {
		const { community } = testCommunity;
		const branch = await createBranch(
			{
				pubId: pub.id,
				title: 'a-slightly-more-permanent-branch',
				communityAdminPermissions: 'none',
				userPermissions: [],
			},
			pubManager.id,
		);
		const agent = await login(unrelatedUser);
		await agent
			.delete('/api/branches')
			.send({
				pubId: pub.id,
				communityId: community.id,
				branchId: branch.id,
			})
			.expect(403);
		const branchNow = await Branch.findOne({ where: { id: branch.id } });
		expect(branchNow).not.toEqual(null);
	});
});

teardown(afterAll, () => {
	firebaseAdminStub.restore();
});
