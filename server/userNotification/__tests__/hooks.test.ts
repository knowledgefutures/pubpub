import { ActivityItem, UserNotification } from 'server/models';
import { createThreadComment } from 'server/threadComment/queries';
import { finishDeferredTasks } from 'server/utils/deferred';
import { modelize, setup, teardown } from 'stubstub';

import { DocJson } from 'types';

const models = modelize`
    User rando {}
    User chattyUser {}
	User craveEmailUser {
		UserNotificationPreferences {
			receiveDiscussionThreadEmails: true
		}
	}
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
			Member {
				permissions: "view"
				user: craveEmailUser
			}
            UserSubscription {
                user: pubSubscriber
            }
            UserSubscription {
                user: sickOfThisThreadUser
            }
			UserSubscription {
				user: craveEmailUser
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
					UserSubscription {
						user: craveEmailUser
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
					UserSubscription {
						user: craveEmailUser
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
					UserSubscription {
						user: craveEmailUser
					}
                }
            }
        }
    }
`;

// eslint-disable-next-line import/extensions
const mailgunMessages = require('../hooks.ts').mg.messages;

setup(beforeAll, async () => {
	await models.resolve();

	// mock mailgun messages so we can listen for them
	jest.spyOn(mailgunMessages, 'create').mockImplementation(
		() =>
			Promise.resolve({
				json: () => Promise.resolve({ status: 'ok', id: 'id' }),
			}) as unknown as Promise<Response>,
	);
});

afterEach(() => {
	jest.clearAllMocks();
});

teardown(afterAll, () => {
	jest.restoreAllMocks();
});

describe('UserNotifications created when ActivityItems are created', () => {
	it('creates the right notifications for a members-only Discussion ThreadComment and sends email to users who have explicitly opted in', async () => {
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
		expect(activityItem?.toJSON()).toMatchObject({
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
						where: { userId: user.id, activityItemId: activityItem?.id },
					}),
				),
			),
		).toEqual([0, 1, 1, 0, 0]);

		// sends email to craveEmailUser
		expect(mailgunMessages.create).toHaveBeenCalledTimes(1);
	});

	it('creates the right notifications for a public Discussion ThreadComment and send emails to users who have explicitly opted in', async () => {
		// check that mock has been reset correctly
		expect(mailgunMessages.create).toHaveBeenCalledTimes(0);

		const {
			chattyUser,
			inactiveSubscriptionUser,
			rando,
			pubSubscriber,
			craveEmailUser,
			publicThread,
			pub,
		} = models;
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
		expect(activityItem?.toJSON()).toMatchObject({
			payload: { threadId: publicThread.id, threadComment: { id: threadComment.id } },
		});
		expect(
			await Promise.all(
				[
					// Creates a UserNotification for an un-permissioned user subscribed to a Thread
					rando,
					// Creates a UserNotification for a user subscribed to a Pub
					pubSubscriber,
					// Creates a UserNotification for a user subscribed to a pub and thread
					craveEmailUser,
					// Does not create a UserNotification for one's own ThreadComment
					chattyUser,
					// Does not create a UserNotification for an inactive subscription
					inactiveSubscriptionUser,
				].map((user) =>
					UserNotification.count({
						where: { userId: user.id, activityItemId: activityItem?.id },
					}),
				),
			),
		).toEqual([1, 1, 1, 0, 0]);

		// sends one email
		expect(mailgunMessages.create).toHaveBeenCalledTimes(1);
	});

	it('creates the right notifications for a members-only Review ThreadComment and does not send emails', async () => {
		const { chattyUser, communityAdmin, pubSubscriber, craveEmailUser, reviewThread, pub } =
			models;
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
		expect(activityItem?.toJSON()).toMatchObject({
			payload: { threadId: reviewThread.id, threadComment: { id: threadComment.id } },
		});
		expect(
			await Promise.all(
				[
					// Creates a UserNotification for a subscriber to the Thread
					communityAdmin,
					craveEmailUser,
					// Does not create a UserNotification for a user subscribed to the parent Pub
					pubSubscriber,
				].map((user) =>
					UserNotification.count({
						where: { userId: user.id, activityItemId: activityItem?.id },
					}),
				),
			),
		).toEqual([1, 1, 0]);

		// sends no email for review thread
		expect(mailgunMessages.create).toHaveBeenCalledTimes(0);
	});
});
