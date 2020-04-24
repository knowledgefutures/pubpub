/* global it, expect, beforeAll, afterAll, beforeEach, afterEach */
import uuid from 'uuid';

import { setup, teardown, login, stub, modelize } from 'stubstub';

import { DiscussionNew as Discussion, Thread, ThreadComment } from 'server/models';
import * as firebaseAdmin from 'server/utils/firebaseAdmin';
import { createDiscussion } from 'server/discussion/queries';

let firebaseStub;

const models = modelize`
	Community community {
		Member {
			permissions: "view"
			User communityViewer {}
		}
		Member {
			permissions: "admin"
			User communityAdmin {}
		}
		Pub draftPub {
			Member {
				permissions: "view"
				User pubViewer {}
			}
		}
		Pub releasePub {
			Release {}
			Member {
				permissions: "admin"
				User releasePubAdmin {}
			}
			Member {
				permissions: "manage"
				User releasePubManager {}
			}
		}
	}
	User guest {}
`;

setup(beforeAll, async () => {
	firebaseStub = stub(firebaseAdmin, 'createFirebaseBranch');
	await models.resolve();
});

beforeEach(() => {
	firebaseStub = stub(firebaseAdmin, 'updateFirebaseDiscussion');
});

afterEach(() => {
	firebaseStub.restore();
});

const makeDiscussion = ({
	pub,
	discussionId,
	threadNumber,
	title = 'Uhh yeah a title',
	content = 'Some test content',
	initAnchorText = 'Some anchor text',
	...whateverElse
}) => {
	const { community } = models;
	return {
		discussionId: discussionId,
		title: title,
		content: content,
		initAnchorText: initAnchorText,
		pubId: pub.id,
		communityId: community.id,
		threadNumber: threadNumber,
		...whateverElse,
	};
};

it('forbids logged-out visitors from making discussions on released pubs', async () => {
	const { releasePub } = models;
	const agent = await login();
	await agent
		.post('/api/discussions')
		.send(makeDiscussion({ pub: releasePub, text: 'Hello world!' }))
		.expect(403);
	expect(firebaseStub.stubs.updateFirebaseDiscussion.called).toEqual(false);
});

it('forbids logged-in visitors from adding discussions to unreleased pubs', async () => {
	const { draftPub, guest } = models;
	const agent = await login(guest);
	await agent
		.post('/api/discussions')
		.send(makeDiscussion({ pub: draftPub, text: 'Hello world!' }))
		.expect(403);
	expect(firebaseStub.stubs.updateFirebaseDiscussion.called).toEqual(false);
});

it('creates a database entry and updates Firebase', async () => {
	const { guest, releasePub } = models;
	const agent = await login(guest);

	const {
		body: { id: discussionId },
	} = await agent
		.post('/api/discussions')
		.send(makeDiscussion({ pub: releasePub, text: 'Hello world!' }))
		.expect(201);

	const discussion = await Discussion.findOne({ where: { id: discussionId } });
	const relatedThread = await Thread.findOne({
		where: { id: discussion.threadId },
		include: [{ model: ThreadComment, as: 'comments' }],
	});

	expect(firebaseStub.stubs.updateFirebaseDiscussion.called).toEqual(true);
	expect(relatedThread.comments[0].text).toEqual('Hello world!');
});

it('respects client-created discussion IDs', async () => {
	const { guest, releasePub } = models;
	const discussionId = uuid.v4();
	const agent = await login(guest);
	const {
		body: { id: receivedDiscussionId },
	} = await agent
		.post('/api/discussions')
		.send(
			makeDiscussion({
				pub: releasePub,
				discussionId: discussionId,
				text: 'Hello world!',
			}),
		)
		.expect(201);
	expect(receivedDiscussionId).toEqual(discussionId);
});

it('increments thread numbers correctly', async () => {
	const { guest, releasePub } = models;
	const agent = await login(guest);
	const {
		body: { number: threadNumber },
	} = await agent
		.post('/api/discussions')
		.send(
			makeDiscussion({
				pub: releasePub,
				text: "Like if you're watching this in 2019!",
			}),
		)
		.expect(201);
	const {
		body: { number: nextThreadNumber },
	} = await agent
		.post('/api/discussions')
		.send(
			makeDiscussion({
				pub: releasePub,
				text: "Like if you're watching this in 2020!",
			}),
		)
		.expect(201);
	expect(nextThreadNumber).toEqual(threadNumber + 1);
});

it('lets only users with canAdmin permissions on a Pub close a discussion', async () => {
	const { releasePub, communityAdmin, releasePubAdmin, releasePubManager } = models;

	const testAgainstUser = async (user, expectSuccess) => {
		const discussion = await createDiscussion(
			makeDiscussion({
				pub: releasePub,
				text: 'some text',
			}),
			communityAdmin,
		);
		const agent = await login(user);
		await agent
			.put('/api/discussions')
			.send(
				makeDiscussion({
					pub: releasePub,
					discussionId: discussion.id,
					isClosed: true,
				}),
			)
			.expect(expectSuccess ? 200 : 403);
		const discussionNow = await Discussion.findOne({ where: { id: discussion.id } });
		expect(!!discussionNow.isClosed).toEqual(expectSuccess);
	};

	await testAgainstUser(releasePubManager, false);
	await testAgainstUser(releasePubAdmin, true);
});

teardown(afterAll, () => {
	firebaseStub.restore();
});
