/* global describe, it, expect, beforeAll, afterAll */
/* eslint-disable no-restricted-syntax */
import sinon from 'sinon';

import { makeUser, makeCommunity, setup, teardown } from '../../../stubstub';
import { createBranch } from '../queries';
import { Branch, BranchPermission } from '../../models';
import { createPub } from '../../pub/queries';
import * as firebaseAdmin from '../../utils/firebaseAdmin';
import { getBranchAccess } from '../permissions';

let firebaseAdminStub;
let testCommunity;
let dumbledore;
let riddle;
let filch;
let snape;
let salazar;
let pub;
let ron;
let draco;
let luna;
const branches = {};

setup(beforeAll, async () => {
	firebaseAdminStub = sinon.stub(firebaseAdmin, 'createFirebaseBranch');
	testCommunity = await makeCommunity();
	dumbledore = testCommunity.admin;
	filch = await makeUser();
	snape = await makeUser();
	riddle = await makeUser();
	ron = await makeUser();
	draco = await makeUser();
	salazar = await makeUser();
	luna = await makeUser();
	pub = await createPub({ communityId: testCommunity.community.id }, filch);
	await Promise.all(
		[
			{
				title: 'greatHall',
				creator: dumbledore,
				communityAdminPermissions: 'manage',
				pubManagerPermissions: 'edit',
				publicPermissions: 'discuss',
				userPermissions: [],
			},
			{
				title: 'roomOfRequirement',
				creator: luna,
				communityAdminPermissions: 'discuss',
				pubManagerPermissions: 'view',
				userPermissions: [
					{ user: dumbledore, permissions: 'manage' },
					{ user: filch, permissions: 'edit' },
				],
			},
			{
				title: 'chamberOfSecrets',
				creator: salazar,
				communityAdminPermissions: 'none',
				pubManagerPermissions: 'none',
				publicPermissions: 'none',
				userPermissions: [
					{ user: riddle, permissions: 'manage' },
					{ user: snape, permissions: 'discuss' },
					{ user: draco, permissions: 'view' },
				],
			},
		].map(async ({ creator, ...branch }) => {
			const { id: branchId } = await createBranch({ pubId: pub.id, ...branch }, creator.id);
			branches[branch.title] = await Branch.findOne({
				include: [{ model: BranchPermission, as: 'permissions' }],
				where: { id: branchId },
			});
		}),
	);
});

const expectWaterfall = (access) => {
	const { canView, canDiscuss, canEdit, canManage } = access;
	if (canManage) {
		expect(canView && canEdit && canDiscuss).toEqual(true);
	}
	if (canEdit) {
		expect(canView && canDiscuss).toEqual(true);
	}
	if (canDiscuss) {
		expect(canView).toEqual(true);
	}
};

const expectAccess = (access, expectation) => {
	Object.entries(expectation).forEach(([key, value]) => {
		expect(access[key]).toEqual(value);
	});
	expectWaterfall(access);
};

describe('getBranchAccess', () => {
	it('works for a user with no permissions whatsoever for a branch', () => {
		const access = getBranchAccess(null, branches.chamberOfSecrets, ron.id, false, false);
		expectAccess(access, { canView: false });
	});

	it('works for a user with a valid edit hash', () => {
		const access = getBranchAccess(
			branches.chamberOfSecrets.editHash,
			branches.chamberOfSecrets,
			ron.id,
			false,
			false,
		);
		expectAccess(access, { canEdit: true });
	});

	it('works for a user with a valid discuss hash', () => {
		const access = getBranchAccess(
			branches.chamberOfSecrets.discussHash,
			branches.chamberOfSecrets,
			ron.id,
			false,
			false,
		);
		expectAccess(access, { canDiscuss: true });
	});

	it('works for a user with a valid view hash', () => {
		const access = getBranchAccess(
			branches.chamberOfSecrets.viewHash,
			branches.chamberOfSecrets,
			ron.id,
			false,
			false,
		);
		expectAccess(access, { canView: true });
	});

	it('works for a user who is invited to manage a branch', () => {
		const access = getBranchAccess(null, branches.chamberOfSecrets, riddle.id, false, false);
		expectAccess(access, { canManage: true });
	});

	it('works for a user who is invited to view a branch', () => {
		const access = getBranchAccess(null, branches.chamberOfSecrets, draco.id, false, false);
		expectAccess(access, { canView: true });
	});

	it('works for a user who is invited to discuss a branch', () => {
		const access = getBranchAccess(null, branches.chamberOfSecrets, snape.id, false, false);
		expectAccess(access, { canDiscuss: true });
	});

	it('works for a user who created the branch', () => {
		const access = getBranchAccess(null, branches.chamberOfSecrets, salazar.id, false, false);
		expectAccess(access, { canManage: true });
	});

	it('works for a pub manager with no access to a branch', () => {
		const access = getBranchAccess(null, branches.chamberOfSecrets, filch.id, false, false);
		expectAccess(access, { canView: false });
	});

	it('works for a community admin with no access to a branch', () => {
		const access = getBranchAccess(null, branches.chamberOfSecrets, filch.id, false, false);
		expectAccess(access, { canView: false });
	});

	it('works for a user with no permissions who can view and discuss a branch', () => {
		const access = getBranchAccess(null, branches.greatHall, ron.id, false, false);
		expectAccess(access, { canDiscuss: true });
	});

	it('works for a community admin who can manage a branch', () => {
		const access = getBranchAccess(null, branches.greatHall, dumbledore.id, true, false);
		expectAccess(access, { canManage: true });
	});

	it('works for a pub manager who can edit a branch', () => {
		const access = getBranchAccess(null, branches.greatHall, filch.id, false, true);
		expectAccess(access, { canEdit: true });
	});

	it('works for a community admin who is also granted elevated manage permissions', () => {
		const access = getBranchAccess(
			null,
			branches.roomOfRequirement,
			dumbledore.id,
			true,
			false,
		);
		expectAccess(access, { canManage: true });
	});

	it('works for a pub manager who is also granted elevated edit permissions', () => {
		const access = getBranchAccess(null, branches.roomOfRequirement, filch.id, true, false);
		expectAccess(access, { canEdit: true });
	});
});

teardown(afterAll, () => {
	firebaseAdminStub.restore();
});
