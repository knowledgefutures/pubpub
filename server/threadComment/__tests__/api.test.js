/* global it, expect, beforeAll, afterAll  */
import { setup, teardown, login, modelize } from 'stubstub';

const models = modelize`
    Community community {
        Member {
            permissions: "view"
            User communityViewer {}
        }
        Member {
            permissions: "view"
            User chattyUser {}
        }
        Member {
            permissions: "view"
            User someMember {}
        }
        Pub pub {
            Member {
                permissions: "admin"
                User pubAdmin {}
            }
            DiscussionNew publicDiscussion {
                number: 1
                author: chattyUser
                Visibility {
                    access: "public"
                }
                Thread publicThread {}
            }
            DiscussionNew otherPublicDiscussion {
                number: 2
                author: chattyUser
                Visibility {
                    access: "public"
                }
                Thread otherPublicThread {}
            }
            DiscussionNew membersDiscussion {
                number: 3
                author: chattyUser
                Visibility {
                    access: "members"
                }
                Thread membersThread {
                    ThreadComment existingComment {
                        author: chattyUser
                    }
                }
            }
            DiscussionNew lockedDiscussion {
                number: 3
                author: chattyUser
                Visibility {
                    access: "members"
                }
                Thread lockedThread {
                    isLocked: true
                }
            }
        }
    }
    User guest {}
    Community otherCommunity {
        Member {
            permissions: "admin"
            User otherCommunityAdmin {}
        }
    }
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

const createThreadComment = ({
	thread,
	discussion = null,
	threadComment = null,
	text = 'Some text',
}) => {
	const { community, pub } = models;
	return {
		threadId: thread.id,
		pubId: pub.id,
		communityId: community.id,
		text: text,
		content: {},
		...(threadComment && { threadCommentId: threadComment.id }),
		...(discussion && { parentId: discussion.id }),
	};
};

it('checks that the provided thread and parent model are related', async () => {
	const { guest, publicDiscussion, otherPublicThread } = models;
	const agent = await login(guest);
	await agent
		.post('/api/threadComment')
		.send(
			createThreadComment({
				discussion: publicDiscussion,
				thread: otherPublicThread,
			}),
		)
		.expect(403);
});

it('allows guests to add to a Discussion with visibility=public', async () => {
	const { guest, publicDiscussion, publicThread } = models;
	const agent = await login(guest);
	const { body: threadComment } = await agent
		.post('/api/threadComment')
		.send(
			createThreadComment({
				discussion: publicDiscussion,
				thread: publicThread,
				text: 'Ah, nevertheless',
			}),
		)
		.expect(201);
	expect(threadComment.text).toEqual('Ah, nevertheless');
	expect(threadComment.threadId).toEqual(publicThread.id);
});

it('forbids guests from adding comments to threads with visibility=members', async () => {
	const { guest, membersDiscussion, membersThread } = models;
	const agent = await login(guest);
	await agent
		.post('/api/threadComment')
		.send(
			createThreadComment({
				discussion: membersDiscussion,
				thread: membersThread,
			}),
		)
		.expect(403);
});

it('allows members to add to threads with visibility=members', async () => {
	const { someMember, membersDiscussion, membersThread } = models;
	const agent = await login(someMember);
	await agent
		.post('/api/threadComment')
		.send(
			createThreadComment({
				discussion: membersDiscussion,
				thread: membersThread,
			}),
		)
		.expect(201);
});

it('forbids adding comments to locked threads', async () => {
	const { someMember, lockedDiscussion, lockedThread } = models;
	const agent = await login(someMember);
	await agent
		.post('/api/threadComment')
		.send(
			createThreadComment({
				discussion: lockedDiscussion,
				thread: lockedThread,
			}),
		)
		.expect(403);
});

it("prevents users from editing others' comments", async () => {
	const { someMember, existingComment, membersDiscussion, membersThread } = models;
	const agent = await login(someMember);
	await agent
		.put('/api/threadComment')
		.send(
			createThreadComment({
				discussion: membersDiscussion,
				thread: membersThread,
				threadComment: existingComment,
				text: 'Actually I agree now',
			}),
		)
		.expect(403);
});

it('allows users to edit their own comments', async () => {
	const { chattyUser, existingComment, membersDiscussion, membersThread } = models;
	const agent = await login(chattyUser);
	const { body: threadComment } = await agent
		.put('/api/threadComment')
		.send(
			createThreadComment({
				discussion: membersDiscussion,
				thread: membersThread,
				threadComment: existingComment,
				text: 'Actually I agree now',
			}),
		)
		.expect(200);
	expect(threadComment.text).toEqual('Actually I agree now');
});

it('allows admins to edit users comments', async () => {
	const { pubAdmin, existingComment, membersDiscussion, membersThread } = models;
	const agent = await login(pubAdmin);
	const { body: threadComment } = await agent
		.put('/api/threadComment')
		.send(
			createThreadComment({
				discussion: membersDiscussion,
				thread: membersThread,
				threadComment: existingComment,
				text: "I eat bees. They're delicious",
			}),
		)
		.expect(200);
	expect(threadComment.text).toEqual("I eat bees. They're delicious");
});
