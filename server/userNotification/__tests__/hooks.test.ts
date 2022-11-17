import { ActivityItem, UserNotification } from 'server/models';
import { createThreadComment } from 'server/threadComment/queries';
import { finishDeferredTasks } from 'server/utils/deferred';
import { modelize, setup, teardown } from 'stubstub';

import { DocJson } from 'types';

const models = modelize`
    User rando {}
    User chattyUser {}
    Community {
        Member {
            permissions: "admin"
            User communityAdmin {}
        }
        Pub pub {
            Member {
                permissions: "manage"
                user: chattyUser
            }
            Member {
                permissions: "view"
                User pubSubscriber {}
            }
            Member {
                permissions: "view"
                User sickOfThisThreadUser {} 
            }
            UserSubscription {
                user: pubSubscriber
            }
            UserSubscription {
                user: sickOfThisThreadUser
            }
            Discussion membersDiscussion {
                number: 0
                author: chattyUser
                Visibility {
                    access: "members"
                }
                Thread membersThread {
                    UserSubscription {
                        user: chattyUser
                    }
                    UserSubscription {
                        user: communityAdmin
                    }
                    UserSubscription {
                        user: sickOfThisThreadUser
                        status: "muted"
                    }
                }
            }
            Discussion publicDiscussion {
                number: 1
                author: chattyUser
                Visibility {
                    access: "public"
                }
                Thread publicThread {
                    UserSubscription {
                        user: rando
                    }
					UserSubscription {
						status: "inactive"
						User inactiveSubscriptionUser {}
					}
                }
            }
            ReviewNew review {
                number: 1
                author: chattyUser
                Visibility {
                    access: "members"
                }
                Thread reviewThread {
                    UserSubscription {
                        user: communityAdmin
                    }
                }
            }
        }
    }
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('UserNotifications created when ActivityItems are created', () => {
	it('creates the right notifications for a members-only Discussion ThreadComment', async () => {
		const {
			membersThread,
			chattyUser,
			rando,
			communityAdmin,
			pubSubscriber,
			sickOfThisThreadUser,
			pub,
		} = models;
		const threadComment = await createThreadComment({
			text: 'Hello members',
			threadId: membersThread.id,
			userId: chattyUser.id,
			content: {} as DocJson,
		});
		await finishDeferredTasks();
		const activityItem = await ActivityItem.findOne({
			where: { pubId: pub.id, kind: 'pub-discussion-comment-added' },
			order: [['createdAt', 'DESC']],
		});
		expect(activityItem.toJSON()).toMatchObject({
			payload: { threadId: membersThread.id, threadComment: { id: threadComment.id } },
		});
		expect(
			await Promise.all(
				[
					// Does not create a UserNotification for an un-permissioned user somehow subscribed to a Thread
					rando,
					// Creates a UserNotification for a permissioned user subscribed to a Thread
					communityAdmin,
					// Creates a UserNotification for a user subscribed to a Pub
					pubSubscriber,
					// Does not create a UserNotification when a muted Thread subscription overrides a Pub subscription
					sickOfThisThreadUser,
					// Does not create a UserNotification for one's own ThreadComment
					chattyUser,
				].map((user) =>
					UserNotification.count({
						where: { userId: user.id, activityItemId: activityItem.id },
					}),
				),
			),
		).toEqual([0, 1, 1, 0, 0]);
	});

	it('creates the right notifications for a public Discussion ThreadComment', async () => {
		const { chattyUser, inactiveSubscriptionUser, rando, pubSubscriber, publicThread, pub } =
			models;
		const threadComment = await createThreadComment({
			text: 'Hello world',
			threadId: publicThread.id,
			userId: chattyUser.id,
			content: {} as DocJson,
		});
		await finishDeferredTasks();
		const activityItem = await ActivityItem.findOne({
			where: { pubId: pub.id, kind: 'pub-discussion-comment-added' },
			order: [['createdAt', 'DESC']],
		});
		expect(activityItem.toJSON()).toMatchObject({
			payload: { threadId: publicThread.id, threadComment: { id: threadComment.id } },
		});
		expect(
			await Promise.all(
				[
					// Creates a UserNotification for an un-permissioned user subscribed to a Thread
					rando,
					// Creates a UserNotification for a user subscribed to a Pub
					pubSubscriber,
					// Does not create a UserNotification for one's own ThreadComment
					chattyUser,
					// Does not create a UserNotification for an inactive subscription
					inactiveSubscriptionUser,
				].map((user) =>
					UserNotification.count({
						where: { userId: user.id, activityItemId: activityItem.id },
					}),
				),
			),
		).toEqual([1, 1, 0, 0]);
	});

	it('creates the right notifications for a members-only Review ThreadComment', async () => {
		const { chattyUser, communityAdmin, pubSubscriber, reviewThread, pub } = models;
		const threadComment = await createThreadComment({
			text: 'Hello world',
			threadId: reviewThread.id,
			userId: chattyUser.id,
			content: {} as DocJson,
		});
		await finishDeferredTasks();
		const activityItem = await ActivityItem.findOne({
			where: { pubId: pub.id, kind: 'pub-review-comment-added' },
			order: [['createdAt', 'DESC']],
		});
		expect(activityItem.toJSON()).toMatchObject({
			payload: { threadId: reviewThread.id, threadComment: { id: threadComment.id } },
		});
		expect(
			await Promise.all(
				[
					// Creates a UserNotification for a subscriber to the Thread
					communityAdmin,
					// Does not create a UserNotification for a user subscribed to the parent Pub
					pubSubscriber,
				].map((user) =>
					UserNotification.count({
						where: { userId: user.id, activityItemId: activityItem.id },
					}),
				),
			),
		).toEqual([1, 0]);
	});
});
