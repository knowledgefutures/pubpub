import uuid from 'uuid';

import { setup, login, modelize, expectCreatedActivityItem } from 'stubstub';

import { Discussion, Thread, ThreadComment } from 'server/models';

const alreadyAppliedManagedLabel = {
	title: 'I have already been applied',
	publicApply: false,
	id: uuid.v4(),
};

const couldApplyManagedLabel = {
	title: 'You need to be an admin to apply me',
	publicApply: false,
	id: uuid.v4(),
};

const publicLabel = {
	title: 'All discussants can apply this label',
	publicApply: true,
	id: uuid.v4(),
};

const pubLabels = [alreadyAppliedManagedLabel, couldApplyManagedLabel, publicLabel];

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
			labels: ${pubLabels}
			Member {
				permissions: "admin"
				User releasePubAdmin {}
			}
			Member {
				permissions: "manage"
				User releasePubManager {}
			}
			Member {
				permissions: "view"
				User releasePubViewer {}
			}
			Discussion existingDiscussion {
				Visibility {
					access: "public"
				}
				Thread {}
				User discussionCreator {}
				number: 1
				labels: ${[alreadyAppliedManagedLabel.id]}
			}
		}
	}
	User guest {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

const makeDiscussion = ({
	pub,
	visibilityAccess,
	discussionId,
	threadNumber,
	title = 'Uhh yeah a title',
	content = 'Some test content',
	historyKey = 0,
	...whateverElse
}: {
	pub: { id: string };
	visibilityAccess: string;
	discussionId?: string;
	threadNumber?: number;
	title?: string;
	content?: string;
	text?: string;
	historyKey?: number;
	initAnchorData?: {
		from: number;
		to: number;
	};
}) => {
	const { community } = models;
	return {
		discussionId,
		title,
		content,
		pubId: pub.id,
		communityId: community.id,
		threadNumber,
		visibilityAccess,
		historyKey,
		...whateverElse,
	};
};

const makeDiscussionUpdate = ({
	pub,
	discussionId,
	isClosed = undefined,
	labels = undefined,
	title = undefined,
}: {
	pub: { id: string };
	discussionId: string;
	isClosed?: boolean;
	labels?: string[];
	title?: string;
}) => {
	const { community } = models;
	return {
		discussionId,
		communityId: community.id,
		pubId: pub.id,
		title,
		isClosed,
		labels,
	};
};

it('forbids logged-out visitors from making discussions on released pubs', async () => {
	const { releasePub } = models;
	const agent = await login();
	await agent
		.post('/api/discussions')
		.send(makeDiscussion({ pub: releasePub, text: 'Hello world!', visibilityAccess: 'public' }))
		.expect(403);
});

it('forbids guests from making comments with visibilityAccess=members', async () => {
	const { draftPub, guest } = models;
	const agent = await login(guest);
	await agent
		.post('/api/discussions')
		.send(makeDiscussion({ pub: draftPub, text: 'Hello world!', visibilityAccess: 'members' }))
		.expect(403);
});

it('creates a database entry (and an ActivityItem)', async () => {
	const { guest, releasePub } = models;
	const agent = await login(guest);

	const {
		body: { id: discussionId },
	} = await expectCreatedActivityItem(
		agent
			.post('/api/discussions')
			.send(
				makeDiscussion({
					pub: releasePub,
					text: 'Hello world!',
					visibilityAccess: 'public',
				}),
			)
			.expect(201),
	).toMatchObject({
		actorId: guest.id,
		pubId: releasePub.id,
		kind: 'pub-discussion-comment-added',
		payload: {
			threadComment: {
				text: 'Hello world!',
			},
		},
	});

	const discussion = await Discussion.findOne({ where: { id: discussionId } });
	const relatedThread = await Thread.findOne({
		where: { id: discussion.threadId },
		include: [{ model: ThreadComment, as: 'comments' }],
	});

	expect(relatedThread.comments[0].text).toEqual('Hello world!');
});

it('creates a DiscussionAnchor when initAnchorData is provided', async () => {
	const { guest, releasePub } = models;
	const agent = await login(guest);

	const {
		body: {
			anchors: [anchor],
		},
	} = await agent
		.post('/api/discussions')
		.send(
			makeDiscussion({
				pub: releasePub,
				text: 'Hello world!',
				visibilityAccess: 'public',
				initAnchorData: { from: 10, to: 20 },
				historyKey: 20,
			}),
		)
		.expect(201);
	expect(anchor.selection).toEqual({ type: 'text', anchor: 10, head: 20 });
	expect(anchor.isOriginal).toEqual(true);
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
				discussionId,
				text: 'Hello world!',
				visibilityAccess: 'public',
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
				visibilityAccess: 'public',
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
				visibilityAccess: 'public',
			}),
		)
		.expect(201);
	expect(nextThreadNumber).toEqual(threadNumber + 1);
});

it('does not let random members update discussions', async () => {
	const { releasePubViewer, releasePub, existingDiscussion } = models;
	const agent = await login(releasePubViewer);

	await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				isClosed: true,
			}),
		)
		.expect(403);

	await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				labels: [alreadyAppliedManagedLabel.id, publicLabel.id],
			}),
		)
		.expect(403);

	await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				title: 'Hahahahahahahaha',
			}),
		)
		.expect(403);
});

it('lets users change the titles of their discussions', async () => {
	const { discussionCreator, releasePub, existingDiscussion } = models;
	const agent = await login(discussionCreator);

	const { body: discussion } = await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				title: 'Different now',
			}),
		)
		.expect(200);

	expect(discussion.title).toEqual('Different now');
});

it('lets users close their discussions, but not re-open them', async () => {
	const { discussionCreator, releasePub, existingDiscussion } = models;
	const agent = await login(discussionCreator);

	const { body: discussion } = await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				isClosed: true,
			}),
		)
		.expect(200);

	expect(discussion.isClosed).toEqual(true);

	await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				isClosed: false,
			}),
		)
		.expect(403);
});

it('lets admins close and open discussions at will', async () => {
	const { releasePubAdmin, releasePub, existingDiscussion } = models;
	const agent = await login(releasePubAdmin);

	const { body: discussion } = await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				isClosed: false,
			}),
		)
		.expect(200);

	expect(discussion.isClosed).toEqual(false);

	const { body: discussionAgain } = await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				isClosed: true,
			}),
		)
		.expect(200);

	expect(discussionAgain.isClosed).toEqual(true);
});

it('lets users apply public labels to their discussions', async () => {
	const { discussionCreator, releasePub, existingDiscussion } = models;
	const agent = await login(discussionCreator);
	const targetLabels = [alreadyAppliedManagedLabel.id, publicLabel.id];

	const { body: discussion } = await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				labels: targetLabels,
			}),
		)
		.expect(200);

	expect(discussion.labels).toEqual(targetLabels);
});

it('forbids users from applying managed labels to their discussions', async () => {
	const { discussionCreator, releasePub, existingDiscussion } = models;
	const agent = await login(discussionCreator);
	const targetLabels = [alreadyAppliedManagedLabel.id, couldApplyManagedLabel.id];

	await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				labels: targetLabels,
			}),
		)
		.expect(403);
});

it('lets admins apply managed labels to discussions', async () => {
	const { releasePubAdmin, releasePub, existingDiscussion } = models;
	const agent = await login(releasePubAdmin);
	const targetLabels = [alreadyAppliedManagedLabel.id, couldApplyManagedLabel.id];

	const { body: discussion } = await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				labels: targetLabels,
			}),
		)
		.expect(200);

	expect(discussion.labels).toEqual(targetLabels);
});

it('forbids users from removing managed labels from their discussions', async () => {
	const { discussionCreator, releasePub, existingDiscussion } = models;
	const agent = await login(discussionCreator);

	const discussionCurrently = await Discussion.findOne({ where: { id: existingDiscussion.id } });
	expect(discussionCurrently.labels.includes(alreadyAppliedManagedLabel.id));

	await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				labels: [],
			}),
		)
		.expect(403);
});

it('lets admins remove managed labels from discussions', async () => {
	const { releasePubAdmin, releasePub, existingDiscussion } = models;
	const agent = await login(releasePubAdmin);
	const targetLabels = [];

	const discussionCurrently = await Discussion.findOne({ where: { id: existingDiscussion.id } });
	expect(discussionCurrently.labels.includes(alreadyAppliedManagedLabel.id));

	const { body: discussion } = await agent
		.put('/api/discussions')
		.send(
			makeDiscussionUpdate({
				pub: releasePub,
				discussionId: existingDiscussion.id,
				labels: targetLabels,
			}),
		)
		.expect(200);

	expect(discussion.labels).toEqual(targetLabels);
});
