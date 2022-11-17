import { modelize, login, setup, teardown } from 'stubstub';

import { UserSubscription } from 'server/models';
import { updateVisibility } from 'server/visibility/queries';
import { createThreadComment } from 'server/threadComment/queries';
import { DocJson } from 'types';

const models = modelize`
    Community {
        Member {
            permissions: "admin"
            User rando {}
        }
    }
    Community {
        Pub pub {
            Member {
                permissions: "view"
                User member {}
            }
            Discussion {
                User {}
                number: 1
                Visibility publicDiscussionVisibility {
                    acccess: "public"
                }
                Thread publicDiscussionThread {}
            }
            Discussion toBeSubscribedTo {
                User {}
                number: 2
                Visibility {
                    access: "public"
                }
                Thread toBeSubscribedToThread {
                    UserSubscription existingSubscription {
                        setAutomatically: true
                        User boredUser {}
                    }
                }
            }
            Discussion {
                User {}
                number: 3
                Visibility {
                    access: "members"
                }
                Thread membersDiscussionThread {}
            }
            Discussion {
                User {}
                number: 4
                Visibility toBeChangedVisibility {
                    access: "public"
                }
                Thread toBeBootedFromThread {
                    UserSubscription toBeRemovedSubscription {
                        setAutomatically: true
                        User toBeBootedUser {}
                    }
                    UserSubscription toRemainSubscription {
                        setAutomatically: true
                        user: member
                    }
                }
            }
            Discussion {
                User {}
                number: 5
                Visibility {
                    access: "public"
                }
                Thread toBeCommentedOnThread {
                    UserSubscription mutedSubscription {
                        setAutomatically: true
                        status: 'muted'
                        User mutedThisThreadUser {}
                    }
                }
            }
            ReviewNew {
                User {}
                number: 28
                Visibility {
                    access: "members"
                }
                Thread membersReviewThread {}
            }
        }
    }
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('/api/threads/subscriptions', () => {
	it('Does not let a non-Member subscribe to a Discussion thread with visibility=members', async () => {
		const { rando, membersDiscussionThread } = models;
		const agent = await login(rando);
		await agent
			.put('/api/threads/subscriptions')
			.send({ threadId: membersDiscussionThread.id, status: 'active' })
			.expect(403);
	});

	it('Lets a Member subscribe to a Discussion thread with visibility=members', async () => {
		const { member, membersDiscussionThread } = models;
		const agent = await login(member);
		const { body: userSubscription } = await agent
			.put('/api/threads/subscriptions')
			.send({ threadId: membersDiscussionThread.id, status: 'active' })
			.expect(200);
		expect(userSubscription).toMatchObject({
			threadId: membersDiscussionThread.id,
			userId: member.id,
			setAutomatically: false,
		});
	});

	it('Does not let a non-Member subscribe to a Review thread with visibility=members', async () => {
		const { rando, membersReviewThread } = models;
		const agent = await login(rando);
		await agent
			.put('/api/threads/subscriptions')
			.send({ threadId: membersReviewThread.id, status: 'active' })
			.expect(403);
	});

	it('Lets a Member subscribe to a Review thread with visibility=members', async () => {
		const { member, membersReviewThread } = models;
		const agent = await login(member);
		const { body: userSubscription } = await agent
			.put('/api/threads/subscriptions')
			.send({ threadId: membersReviewThread.id, status: 'active' })
			.expect(200);
		expect(userSubscription).toMatchObject({
			threadId: membersReviewThread.id,
			userId: member.id,
			setAutomatically: false,
			status: 'active',
		});
	});

	it('Lets a non-Member subscribe to a Review thread with visibility=public', async () => {
		const { rando, toBeSubscribedToThread } = models;
		const agent = await login(rando);
		const { body: userSubscription } = await agent
			.put('/api/threads/subscriptions')
			.send({ threadId: toBeSubscribedToThread.id, status: 'active' })
			.expect(200);
		expect(userSubscription).toMatchObject({
			threadId: toBeSubscribedToThread.id,
			userId: rando.id,
			setAutomatically: false,
			status: 'active',
		});
	});

	it('Lets a user mute a thread', async () => {
		const { toBeSubscribedToThread, existingSubscription, boredUser } = models;
		const agent = await login(boredUser);
		await agent
			.put('/api/threads/subscriptions')
			.send({ threadId: toBeSubscribedToThread.id, status: 'muted' })
			.expect(200);
		const mutedThread = await UserSubscription.findOne({
			where: { id: existingSubscription.id },
		});
		expect(mutedThread.status).toEqual('muted');
	});
});

describe('Visibility hooks updating UserSubscriptions', () => {
	it('Kicks some users from a thread when visibility access changes', async () => {
		const { toBeRemovedSubscription, toRemainSubscription, toBeChangedVisibility } = models;
		await updateVisibility({ visibilityId: toBeChangedVisibility.id, access: 'members' });
		expect(
			await UserSubscription.count({
				where: { id: toBeRemovedSubscription.id },
			}),
		).toBe(0);
		expect(
			await UserSubscription.count({
				where: { id: toRemainSubscription.id },
			}),
		).toBe(1);
	});
});

describe('ThreadComment hooks creating UserSubscriptions', () => {
	it('Automatically subscribes users to a thread when they add a comment', async () => {
		const { toBeCommentedOnThread, rando } = models;
		await createThreadComment({
			text: 'bahhh',
			content: {} as DocJson,
			threadId: toBeCommentedOnThread.id,
			userId: rando.id,
		});
		expect(
			await UserSubscription.findOne({
				where: { userId: rando.id, threadId: toBeCommentedOnThread.id },
			}),
		).toMatchObject({
			userId: rando.id,
			threadId: toBeCommentedOnThread.id,
			status: 'active',
		});
	});

	it('Does not un-mute existing subscriptions when users add a comment', async () => {
		const { toBeCommentedOnThread, mutedThisThreadUser, mutedSubscription } = models;
		await createThreadComment({
			text: 'bahhh',
			content: {} as DocJson,
			threadId: toBeCommentedOnThread.id,
			userId: mutedThisThreadUser.id,
		});
		expect(
			await UserSubscription.findOne({
				where: { userId: mutedThisThreadUser.id, threadId: toBeCommentedOnThread.id },
			}),
		).toMatchObject({
			id: mutedSubscription.id,
			userId: mutedThisThreadUser.id,
			threadId: toBeCommentedOnThread.id,
			status: 'muted',
		});
	});
});
