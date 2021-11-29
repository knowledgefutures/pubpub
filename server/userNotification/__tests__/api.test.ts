/* global describe, it, expect, beforeAll, afterAll */
import uuid from 'uuid/v4';

import { UserNotification } from 'server/models';
import { modelize, login, setup, teardown } from 'stubstub';

const communityId = uuid();
const pubId = uuid();

const models = modelize`
    User user {}
    User rando {}

    Community community {
		id: ${communityId}
        Pub pub {
			id: ${pubId}
            Discussion {
                number: 1
                author: user
                thread: thread
                Visibility {
                    access: "public"
                }
            }
        }
    }

    ActivityItem activityItem1 {
        community: community
        pub: pub
        kind: 'pub-discussion-comment-added'
    }

    ActivityItem activityItem2 {
        community: community
        pub: pub
        kind: 'pub-discussion-comment-added'
    }

    ActivityItem activityItem3 {
        community: community
        pub: pub
        kind: 'pub-discussion-comment-added'
    }

    Thread thread {
        UserSubscription {
            user: user
            setAutomatically: true
            UserNotification n1 {
                user: user
                activityItem: activityItem1
            }
            UserNotification n2 {
                user: user
                activityItem: activityItem2
            }
            UserNotification n3 {
                user: user
                activityItem: activityItem3
            }
        }
    }
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('/api/userNotifications', () => {
	it("Does not let a user manipulate another user's notifications", async () => {
		const { rando, n1, n2, n3 } = models;
		const agent = await login(rando);
		await agent
			.post('/api/userNotifications')
			.send({
				userNotificationIds: [n1, n2, n3].map((n) => n.id),
				isRead: true,
				manuallySetIsRead: true,
			})
			.expect(403);
		await agent
			.delete('/api/userNotifications')
			.send({ userNotificationIds: [n1, n2, n3].map((n) => n.id) })
			.expect(403);
	});

	it('Lets a user mark their own notifications as read and unread', async () => {
		const { user, n1, n2, n3 } = models;
		const agent = await login(user);
		await agent
			.post('/api/userNotifications')
			.send({
				userNotificationIds: [n1, n2, n3].map((n) => n.id),
				isRead: true,
				manuallySetIsRead: true,
			})
			.expect(200);
		expect(
			await UserNotification.count({
				where: { userId: user.id, isRead: true, manuallySetIsRead: true },
			}),
		).toEqual(3);
		await agent
			.post('/api/userNotifications')
			.send({
				userNotificationIds: [n1, n2, n3].map((n) => n.id),
				isRead: false,
				manuallySetIsRead: false,
			})
			.expect(200);
		expect(
			await UserNotification.count({
				where: { userId: user.id, isRead: true },
			}),
		).toEqual(0);
	});

	it('Lets a user delete their own notificagtions', async () => {
		const { user, n1, n2, n3 } = models;
		const agent = await login(user);
		await agent
			.delete('/api/userNotifications')
			.send({ userNotificationIds: [n1, n2, n3].map((n) => n.id) })
			.expect(200);
		expect(await UserNotification.count({ where: { userId: user.id } })).toEqual(0);
	});
});
