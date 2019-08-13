/* global describe, it, expect, beforeAll, afterAll */

import { makeUser, makeCommunity, setup, teardown, stub } from '../../../stubstub';

import { createPub } from '../../pub/queries';
import { createBranch } from '../../branch/queries';
import { getPermissions } from '../permissions';

import * as firebaseAdmin from '../../utils/firebaseAdmin';

let firebaseStub;
let targetCommunity;
let targetPubManager;
let targetPub;
let targetBranch;
let attackerCommunity;
let attacker;

setup(beforeAll, async () => {
	firebaseStub = stub(firebaseAdmin, 'createFirebaseBranch');
	targetCommunity = await makeCommunity();
	targetPubManager = await makeUser();
	targetPub = await createPub({ communityId: targetCommunity.community.id }, targetPubManager);
	targetBranch = await createBranch(
		{
			pubId: targetPub.id,
			title: 'just-doing-normal-stuff',
			publicPermissions: 'none',
			pubManagerPermissions: 'manage',
			communityAdminPermissions: 'manage',
			userPermissions: [],
		},
		targetPubManager.id,
	);
	attackerCommunity = await makeCommunity();
	attacker = attackerCommunity.admin;
	await createPub({ communityId: attackerCommunity.community.id }, attacker);
	await createPub({ communityId: targetCommunity.community.id }, attacker);
	await createBranch(
		{
			pubId: targetPub.id,
			title: 'nothing-to-see-here',
			pubManagerPermissions: 'manage',
			communityAdminPermissions: 'manage',
			userPermissions: [],
		},
		attacker.id,
	);
});

describe('getPermissions', () => {
	it('does not leak permissions to managers of adjacent communities, pubs, or branches', async () => {
		const permissions = await getPermissions({
			userId: attacker.id,
			pubId: targetPub.id,
			communityId: targetCommunity.community.id,
			branchId: targetBranch.id,
		});
		expect(permissions.create).toEqual(false);
		expect(permissions.update).toEqual(false);
	});
});

teardown(afterAll, () => {
	firebaseStub.restore();
});
