import uuid from 'uuid/v4';

import { UserNotification } from 'server/models';
import { modelize, login, setup, teardown } from 'stubstub';
import { PubDiscussionCommentAddedActivityItem } from 'types';

import { fetchUserNotifications } from '../queries';

const communityId = uuid();
const pubId = uuid();
const baseTimestamp = '2021-12-00:00:00.000';

const getDateForElapsedMinutes = (minutes: number) => {
	const timestamp = new Date(baseTimestamp).valueOf();
	return new Date(timestamp + minutes * 60 * 1000);
};

const getTimestampForElapsedMinutes = (minutes: number) => {
	return getDateForElapsedMinutes(minutes).toISOString();
};

const fakePayload: PubDiscussionCommentAddedActivityItem['payload'] = {
	threadComment: {
		id: uuid(),
		text: 'hmm',
		userId: uuid(),
		commenterId: null,
	},
	threadId: uuid(),
	discussionId: uuid(),
	isReply: true,
	pub: {
		title: 'Fake',
	},
};

const models = modelize`
    User user {
		UserNotificationPreferences {
			notificationCadence: 60
			lastReceivedNotificationsAt: ${getTimestampForElapsedMinutes(65)}
		}
	}
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
        communityId: ${communityId}
        pubId: ${pubId}
        kind: 'pub-discussion-comment-added'
		payload: ${fakePayload}
    }

    ActivityItem activityItem2 {
        communityId: ${communityId}
        pubId: ${pubId}
        kind: 'pub-discussion-comment-added'
		payload: ${fakePayload}

    }

    ActivityItem activityItem3 {
        communityId: ${communityId}
        pubId: ${pubId}
        kind: 'pub-discussion-comment-added'
		payload: ${fakePayload}
    }

    Thread thread {
        UserSubscription {
            user: user
            setAutomatically: true
            UserNotification n1 {
                user: user
                activityItem: activityItem1
				createdAt: ${getTimestampForElapsedMinutes(0)}
            }
            UserNotification n2 {
                user: user
                activityItem: activityItem2
				createdAt: ${getTimestampForElapsedMinutes(60)}
            }
            UserNotification n3 {
                user: user
                activityItem: activityItem3
				createdAt: ${getTimestampForElapsedMinutes(75)}
            }
        }
    }
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('fetchUserNotifications()', () => {
	it("respects a user's notificationCadence", async () => {
		const { n1, n2, n3, user } = models;
		const { notifications: notifications80 } = await fetchUserNotifications({
			userId: user.id,
			now: getDateForElapsedMinutes(80),
		});
		// At t = 80 min, n1-n3 already exist, but because the user fetched notifications at t0 = 65
		// and has a cadence of c = 60, we won't show notifications newer than t0 until t1 = t0 + c
		expect(notifications80.map((n) => n.id)).toEqual([n2.id, n1.id]);
		// Fetch the notifications again at t1 = t0 + c = 125 min
		const { notifications: notifications125 } = await fetchUserNotifications({
			userId: user.id,
			now: getDateForElapsedMinutes(125),
		});
		expect(notifications125.map((n) => n.id)).toEqual([n3.id, n2.id, n1.id]);
	});
});

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
