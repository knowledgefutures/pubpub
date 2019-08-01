/* global describe, it, expect, beforeAll, afterAll, beforeEach, afterEach */
import uuid from 'uuid';

import { makeUser, makeCommunity, setup, teardown, login, stub } from '../../../stubstub';
import { Discussion, Branch } from '../../models';

import * as firebaseAdmin from '../../utils/firebaseAdmin';
import { createDiscussion } from '../queries';
import { createPub } from '../../pub/queries';
import { createBranch } from '../../branch/queries';

let firebaseStub;
let testCommunity;
let pub;
let pubManager;
let branchCreator;
let randomVisitor;
let invitedToView;
let invitedToDiscuss;
let invitedToManage;
let openBranch;
let closedBranch;
let secretiveBranch;
let makeDiscussion;

beforeEach(() => {
	firebaseStub = stub(firebaseAdmin, 'updateFirebaseDiscussion');
});

afterEach(() => {
	firebaseStub.restore();
});

setup(beforeAll, async () => {
	firebaseStub = stub(firebaseAdmin, 'createFirebaseBranch');
	testCommunity = await makeCommunity();
	pubManager = await makeUser();
	randomVisitor = await makeUser();
	invitedToView = await makeUser();
	invitedToDiscuss = await makeUser();
	invitedToManage = await makeUser();
	branchCreator = await makeUser();
	pub = await createPub({ communityId: testCommunity.community.id }, pubManager);
	openBranch = await createBranch(
		{
			pubId: pub.id,
			title: 'branch-for-open-discussions',
			publicPermissions: 'discuss',
			userPermissions: [],
			// These should not make a difference because they're superseded by publicPermissions
			pubManagerPermissions: 'none',
			communityAdminPermissions: 'none',
		},
		branchCreator.id,
	);
	closedBranch = await createBranch(
		{
			pubId: pub.id,
			title: 'branch-for-secret-discussions',
			publicPermissions: 'none',
			pubManagerPermissions: 'discuss',
			communityAdminPermissions: 'discuss',
			userPermissions: [],
		},
		branchCreator.id,
	);
	secretiveBranch = await createBranch(
		{
			pubId: pub.id,
			title: 'branch-for-secret-discussions',
			publicPermissions: 'none',
			pubManagerPermissions: 'none',
			communityAdminPermissions: 'none',
			userPermissions: [
				{ user: invitedToView, permissions: 'view' },
				{ user: invitedToDiscuss, permissions: 'discuss' },
				{ user: invitedToManage, permissions: 'manage' },
			],
		},
		branchCreator.id,
	);

	makeDiscussion = ({
		discussionId,
		branchId,
		threadNumber,
		title = 'Uhh yeah a title',
		text = 'Hello, a discussion!',
		content = 'Some test content',
		initAnchorText = 'Some anchor text',
		...whateverElse
	}) => ({
		discussionId: discussionId,
		title: title,
		content: content,
		text: text,
		initAnchorText: initAnchorText,
		pubId: pub.id,
		communityId: testCommunity.community.id,
		branchId: branchId,
		threadNumber: threadNumber,
		...whateverElse,
	});
});

describe('/api/discussions', () => {
	it('forbids logged-out visitors from making discussions', async () => {
		const agent = await login();
		await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: openBranch.id, text: 'Hello world!' }))
			.expect(403);
		expect(firebaseStub.stubs.updateFirebaseDiscussion.called).toEqual(false);
	});

	it('creates a database entry and updates Firebase', async () => {
		const agent = await login(randomVisitor);
		const {
			body: { id: discussionId },
		} = await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: openBranch.id, text: 'Hello world!' }))
			.expect(201);
		const discussion = await Discussion.findOne({ where: { id: discussionId } });
		expect(firebaseStub.stubs.updateFirebaseDiscussion.called).toEqual(true);
		expect(discussion.text).toEqual('Hello world!');
	});

	it('respects client-created discussion IDs', async () => {
		const discussionId = uuid.v4();
		const agent = await login(randomVisitor);
		const {
			body: { id: receivedDiscussionId },
		} = await agent
			.post('/api/discussions')
			.send(
				makeDiscussion({
					discussionId: discussionId,
					branchId: openBranch.id,
					text: 'Hello world!',
				}),
			)
			.expect(201);
		expect(receivedDiscussionId).toEqual(discussionId);
	});

	it('increments thread numbers correctly', async () => {
		const agent = await login(randomVisitor);
		const {
			body: { threadNumber },
		} = await agent
			.post('/api/discussions')
			.send(
				makeDiscussion({
					branchId: openBranch.id,
					text: "Like if you're watching this in 2019!",
				}),
			)
			.expect(201);
		const {
			body: { threadNumber: nextThreadNumber },
		} = await agent
			.post('/api/discussions')
			.send(
				makeDiscussion({
					branchId: openBranch.id,
					text: "Like if you're watching this in 2020!",
				}),
			)
			.expect(201);
		expect(nextThreadNumber).toEqual(threadNumber + 1);
	});

	it('lets publicPermissions supersede communityAdminPermissions', async () => {
		const { admin } = testCommunity;
		const agent = await login(admin);
		const {
			body: { id: discussionId },
		} = await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: openBranch.id, text: "I'm a admin!" }))
			.expect(201);
		const discussion = await Discussion.findOne({ where: { id: discussionId } });
		expect(discussion.text).toEqual("I'm a admin!");
	});

	it('lets publicPermissions supersede pubManagerPermissions', async () => {
		const agent = await login(pubManager);
		const {
			body: { id: discussionId },
		} = await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: openBranch.id, text: "I'm an pub manager!" }))
			.expect(201);
		const discussion = await Discussion.findOne({ where: { id: discussionId } });
		expect(discussion.text).toEqual("I'm an pub manager!");
	});

	it('respects communityAdminPermissions="discuss"', async () => {
		const { admin } = testCommunity;
		const agent = await login(admin);
		const {
			body: { id: discussionId },
		} = await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: closedBranch.id, text: "I'm a admin!" }))
			.expect(201);
		const discussion = await Discussion.findOne({ where: { id: discussionId } });
		expect(discussion.text).toEqual("I'm a admin!");
	});

	it('respects pubManagerPermissions="discuss"', async () => {
		const agent = await login(pubManager);
		const {
			body: { id: discussionId },
		} = await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: closedBranch.id, text: "I'm an pub manager!" }))
			.expect(201);
		const discussion = await Discussion.findOne({ where: { id: discussionId } });
		expect(discussion.text).toEqual("I'm an pub manager!");
	});

	it('forbids users without appropriate permissions from adding discussions', async () => {
		const agent = await login(randomVisitor);
		await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: closedBranch.id, text: 'Hello world!' }))
			.expect(403);
	});

	it('respects discuss hashes', async () => {
		const agent = await login(randomVisitor);
		const { discussHash } = await Branch.findOne({ where: { id: secretiveBranch.id } });
		const {
			body: { id: discussionId },
		} = await agent
			.post('/api/discussions')
			.send(
				makeDiscussion({
					branchId: secretiveBranch.id,
					discussHash: discussHash,
					text: 'Lol what now',
				}),
			)
			.expect(201);
		const discussion = await Discussion.findOne({ where: { id: discussionId } });
		expect(discussion.text).toEqual('Lol what now');
	});

	it('respects individual discuss permissions', async () => {
		const agent = await login(invitedToDiscuss);
		const {
			body: { id: discussionId },
		} = await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: secretiveBranch.id, text: 'Henlo world!' }))
			.expect(201);
		const discussion = await Discussion.findOne({ where: { id: discussionId } });
		expect(discussion.text).toEqual('Henlo world!');
	});

	it('does not confuse discuss permissions for view permissions', async () => {
		const agent = await login(invitedToView);
		await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: secretiveBranch.id, text: 'Henlo world!' }))
			.expect(403);
	});

	it('respects communityAdminPermissions="none"', async () => {
		const { admin } = testCommunity;
		const agent = await login(admin);
		await agent
			.post('/api/discussions')
			.send(makeDiscussion({ branchId: secretiveBranch.id, text: "I'm...an admin?" }))
			.expect(403);
	});

	it('respects pubManagerPermissions="none"', async () => {
		const agent = await login(pubManager);
		await agent
			.post('/api/discussions')
			.send(
				makeDiscussion({
					branchId: secretiveBranch.id,
					text: "You can't do this to me! Do you have any idea who I am?",
				}),
			)
			.expect(403);
	});

	it('updates reasonable values on Discussion', async () => {
		const discussion = await createDiscussion(
			makeDiscussion({
				branchId: openBranch.id,
				text: 'old text',
			}),
			randomVisitor,
		);
		const agent = await login(randomVisitor);
		await agent
			.put('/api/discussions')
			.send(
				makeDiscussion({
					branchId: openBranch.id,
					discussionId: discussion.id,
					text: 'new text',
					isArchived: true,
				}),
			)
			.expect(200);
		const discussionNow = await Discussion.findOne({ where: { id: discussion.id } });
		expect(discussionNow.text).toEqual('new text');
		expect(discussionNow.isArchived).toEqual(true);
	});

	it('allows users to update their discussion even after permissions have changed', async () => {
		// This user doesn't actually have permissions to create a discussion on this branch,
		// but maybe they did at some point in the past.
		const discussion = await createDiscussion(
			makeDiscussion({
				branchId: secretiveBranch.id,
				text: "THERE'S A PLACE OFF OCEAN AVENUE",
			}),
			randomVisitor,
		);
		const agent = await login(randomVisitor);
		await agent
			.put('/api/discussions')
			.send(
				makeDiscussion({
					branchId: secretiveBranch.id,
					discussionId: discussion.id,
					text: 'WHERE I USED TO SIT AND TALK WITH YOU',
				}),
			)
			.expect(200);
	});

	it('updates reasonable values on discussions', async () => {
		const discussion = await createDiscussion(
			makeDiscussion({
				branchId: openBranch.id,
				text: 'old text',
			}),
			randomVisitor,
		);
		const agent = await login(randomVisitor);
		await agent
			.put('/api/discussions')
			.send(
				makeDiscussion({
					branchId: openBranch.id,
					discussionId: discussion.id,
					text: 'new text',
					isArchived: true,
				}),
			)
			.expect(200);
		const discussionNow = await Discussion.findOne({ where: { id: discussion.id } });
		expect(discussionNow.text).toEqual('new text');
		expect(discussionNow.isArchived).toEqual(true);
	});

	it('lets users with canManage permissions on a branch archive its discussions', async () => {
		const discussion = await createDiscussion(
			makeDiscussion({
				branchId: secretiveBranch.id,
				text: 'some text',
			}),
			invitedToDiscuss,
		);
		const agent = await login(invitedToManage);
		await agent
			.put('/api/discussions')
			.send(
				makeDiscussion({
					branchId: secretiveBranch.id,
					discussionId: discussion.id,
					text: 'new text',
					isArchived: true,
				}),
			)
			.expect(200);
		const discussionNow = await Discussion.findOne({ where: { id: discussion.id } });
		expect(discussionNow.text).toEqual('new text');
		expect(discussionNow.isArchived).toEqual(true);
	});

	it("forbids users from updating other users' discussions", async () => {
		const discussion = await createDiscussion(
			makeDiscussion({
				branchId: secretiveBranch.id,
				text: "THERE'S A PLACE OFF OCEAN AVENUE",
			}),
			invitedToDiscuss,
		);
		const agent = await login(randomVisitor);
		await agent
			.put('/api/discussions')
			.send(
				makeDiscussion({
					branchId: secretiveBranch.id,
					discussionId: discussion.id,
					text: 'WHERE I USED TO SIT AND TALK WITH YOU',
				}),
			)
			.expect(403);
	});
});

teardown(afterAll, () => {
	firebaseStub.restore();
});
