/* global describe, it, expect, beforeAll, afterAll */
import sinon from 'sinon';

import { makeUser, makeCommunity, setup, teardown, login } from '../../../stubstub';
import { CommunityAdmin } from '../../models';

import * as mailchimp from '../../utils/mailchimp';
import { createCommunityAdmin } from '../queries';

let mailchimpStub;
let testCommunity;

setup(beforeAll, async () => {
	mailchimpStub = sinon.stub(mailchimp, 'subscribeUser');
	testCommunity = await makeCommunity();
});

describe('/api/communityAdmins', () => {
	it('prevents users from making themselves admins', async () => {
		const { community } = testCommunity;
		const pretenderToTheThrone = await makeUser();
		const agent = await login(pretenderToTheThrone);
		await agent
			.post('/api/communityAdmins')
			.send({ userId: pretenderToTheThrone.id, communityId: community.id })
			.expect(403);
		const caNow = await CommunityAdmin.findOne({
			where: {
				userId: pretenderToTheThrone.id,
				communityId: community.id,
			},
		});
		expect(caNow).toBeNull();
	});

	it('allows community admins to make other community admins', async () => {
		const { admin, community } = testCommunity;
		const newlyMintedAdmin = await makeUser();
		const agent = await login(admin);
		await agent
			.post('/api/communityAdmins')
			.send({ userId: newlyMintedAdmin.id, communityId: community.id })
			.expect(201);
		const caNow = await CommunityAdmin.findOne({
			where: {
				userId: newlyMintedAdmin.id,
				communityId: community.id,
			},
		});
		expect(caNow).toBeTruthy();
	});

	it('permits backstabbing removals of other community admins', async () => {
		const { admin, community } = testCommunity;
		const treacherousAdmin = await makeUser();
		await createCommunityAdmin({ userId: treacherousAdmin.id, communityId: community.id });
		const agent = await login(treacherousAdmin);
		await agent
			.delete('/api/communityAdmins')
			.send({ userId: admin.id, communityId: community.id })
			.expect(201);
		const caNow = await CommunityAdmin.findOne({
			where: {
				userId: admin.id,
				communityId: community.id,
			},
		});
		expect(caNow).toBeNull();
		// Calm down bro it was just a prank
		await createCommunityAdmin({ userId: admin.id, communityId: community.id });
	});

	it('prevents users from deleting community admins without permission', async () => {
		const { admin, community } = testCommunity;
		const expensivePentestingContractor = await makeUser();
		const agent = await login(expensivePentestingContractor);
		await agent
			.delete('/api/communityAdmins')
			.send({ userId: admin.id, communityId: community.id })
			.expect(403);
		const caNow = await CommunityAdmin.findOne({
			where: {
				userId: admin.id,
				communityId: community.id,
			},
		});
		expect(caNow).toBeTruthy();
	});
});

teardown(afterAll, async () => {
	mailchimpStub.restore();
});
