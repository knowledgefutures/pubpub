/* global describe, it, expect, beforeAll, afterAll */
import {
	makeUser,
	makeCommunity,
	setup,
	teardown,
	stubFirebaseAdmin,
	login,
} from '../../../stubstub';
import { createBranch } from '../../branch/queries';
import { createPub } from '../../pub/queries';
import { Branch } from '../../models';

let community;
let host;
let visitor;
let userA;
let pubManager;
let pub;
let publicBranch;
let draftBranch;
let branchA;

stubFirebaseAdmin();

setup(beforeAll, async () => {
	const tc = await makeCommunity();
	community = tc.community;
	host = community.subdomain + '.pubpub.org';
	visitor = await makeUser();
	userA = await makeUser();
	pubManager = await makeUser();
	pub = await createPub({ communityId: community.id }, pubManager);
	publicBranch = await Branch.findOne({ where: { pubId: pub.id, title: 'public' } });
	draftBranch = await Branch.findOne({ where: { pubId: pub.id, title: 'draft' } });
	// Set up some branches
	branchA = await createBranch(
		{
			pubId: pub.id,
			title: 'a-visible-branch',
			userPermissions: [{ user: { id: userA.id }, permissions: 'manage' }],
		},
		pubManager.id,
	);
});

describe('/pub', () => {
	it('302s from /pub/slug to the draft branch when the #public branch is empty', async () => {
		const agent = await login(pubManager);
		const { headers } = await agent
			.get(`/pub/${pub.slug}`)
			.set('Host', host)
			.expect(302);
		expect(headers.location).toEqual(`/pub/${pub.slug}/branch/${draftBranch.shortId}/`);
	});

	it('302s from /pub/slug to an editable branch when the #public branch is empty', async () => {
		const agent = await login(userA);
		const { headers } = await agent
			.get(`/pub/${pub.slug}`)
			.set('Host', host)
			.expect(302);
		expect(headers.location).toEqual(`/pub/${pub.slug}/branch/${branchA.shortId}/`);
	});

	it('404s for a user who has permission to view the public branch, when it is empty', async () => {
		const agent = await login(pubManager);
		await agent
			.get(`/pub/${pub.slug}/branch/${publicBranch.shortId}`)
			.set('Host', host)
			.expect(404);
	});

	it('404s for a user who has no permission to view the pub', async () => {
		const agent = await login(visitor);
		await agent
			.get(`/pub/${pub.slug}`)
			.set('Host', host)
			.expect(404);
	});

	it('200s for a user seeking to visit the draft branch, when they have permission', async () => {
		const agent = await login(pubManager);
		await agent
			.get(`/pub/${pub.slug}/branch/${draftBranch.shortId}/`)
			.set('Host', host)
			.expect(200);
	});

	it('200s for a user seeking to visit another branch, when they have permission', async () => {
		const agent = await login(userA);
		await agent
			.get(`/pub/${pub.slug}/branch/${branchA.shortId}/`)
			.set('Host', host)
			.expect(200);
	});

	it('200s for a pub manager seeking to visit /manage', async () => {
		const agent = await login(pubManager);
		await agent
			.get(`/pub/${pub.slug}/manage`)
			.set('Host', host)
			.expect(200);
	});

	it('200s for a pub manager seeking to visit #public, when it has content', async () => {
		await publicBranch.update({ firstKeyAt: new Date() });
		const agent = await login(pubManager);
		await agent
			.get(`/pub/${pub.slug}`)
			.set('Host', host)
			.expect(200);
	});

	it('200s for a user seeking to visit #public, when it has content', async () => {
		await publicBranch.update({ firstKeyAt: new Date() });
		const agent = await login(visitor);
		await agent
			.get(`/pub/${pub.slug}`)
			.set('Host', host)
			.expect(200);
	});
});

teardown(afterAll);
