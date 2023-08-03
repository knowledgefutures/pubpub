import { Op } from 'sequelize';

import * as types from 'types';
import { ActivityItem, UserNotification, UserSubscription } from 'server/models';
import { fetchAssociationsForActivityItems } from 'server/activityItem/fetch';
import {
	getOrCreateUserNotificationPreferences,
	updateUserNotificationPreferences,
} from 'server/userNotificationPreferences/queries';
import { fetchFacetsForScopeIds } from 'server/facets';

type FetchOptions = {
	userId: string;
	offset?: number;
	limit?: number;
	now?: Date;
};

type CreateOptions = Pick<
	types.UserNotification,
	'activityItemId' | 'userSubscriptionId' | 'userId'
>;

type MarkReadOptions = {
	userNotificationIds: string[];
	userId: string;
	isRead: boolean;
	manuallySetIsRead: boolean;
};

type DeleteOptions = {
	userId: string;
	userNotificationIds: string[];
};

const getLatestNotificationDateToShow = async (
	preferences: types.UserNotificationPreferences,
	now: Date,
) => {
	const { userId, notificationCadence, lastReceivedNotificationsAt } = preferences;

	const updateLastReceived = async () => {
		await updateUserNotificationPreferences({
			userId,
			preferences: { lastReceivedNotificationsAt: now.toISOString() },
		});
	};

	if (notificationCadence && lastReceivedNotificationsAt) {
		const nowTimestamp = now.valueOf();
		const notificationCadenceMs = 1000 * 60 * notificationCadence;
		const lastReceivedNotificationsTimestamp = new Date(lastReceivedNotificationsAt).valueOf();
		const timeElapsedSinceReceiving = nowTimestamp - lastReceivedNotificationsTimestamp;
		const isTimeToUpdate = timeElapsedSinceReceiving >= notificationCadenceMs;
		if (isTimeToUpdate) {
			await updateLastReceived();
			return null;
		}
		return lastReceivedNotificationsAt;
	}

	await updateLastReceived();
	return null;
};

export const fetchUserNotifications = async (
	options: FetchOptions,
): Promise<types.UserNotificationsFetchResult> => {
	const { userId, offset = 0, limit = 50, now = new Date() } = options;
	const notificationPreferences = await getOrCreateUserNotificationPreferences(userId);
	const latestDateToShow = await getLatestNotificationDateToShow(notificationPreferences, now);
	const sharedWhere = {
		userId,
		...(latestDateToShow && { createdAt: { [Op.lte]: latestDateToShow } }),
	};

	const [maybeUnreadNotifications, readNotifications] = await Promise.all([
		offset === 0 &&
			UserNotification.findAll({
				where: { ...sharedWhere, isRead: false },
				include: [{ model: ActivityItem, as: 'activityItem' }],
				order: [['createdAt', 'DESC']],
			}),
		UserNotification.findAll({
			where: { ...sharedWhere, isRead: true },
			limit,
			offset,
			include: [{ model: ActivityItem, as: 'activityItem' }],
			order: [['createdAt', 'DESC']],
		}),
	]);

	const allNotifications: types.DefinitelyHas<
		types.SequelizeModel<types.UserNotificationWithActivityItem>,
		'activityItem'
	>[] = [...(maybeUnreadNotifications || []), ...readNotifications];

	const allPubIds = allNotifications.map((n) => n.activityItem.pubId);

	const [subscriptions, associations, facets] = await Promise.all([
		UserSubscription.findAll({
			where: {
				userId,
				id: { [Op.in]: [...new Set(allNotifications.map((n) => n.userSubscriptionId))] },
			},
		}),
		fetchAssociationsForActivityItems(
			allNotifications.map((notification) => notification.activityItem),
		),
		fetchFacetsForScopeIds({ pub: allPubIds }, ['PubHeaderTheme']),
	]);

	return {
		notifications: allNotifications.map((n) => n.toJSON()),
		associations,
		subscriptions,
		facets,
		notificationPreferences,
	};
};

export const createUserNotification = async (
	options: CreateOptions,
): Promise<types.SequelizeModel<types.UserNotification>> => {
	const { activityItemId, userId, userSubscriptionId } = options;
	return UserNotification.create({ activityItemId, userId, userSubscriptionId });
};

export const markUserNotificationsRead = async (options: MarkReadOptions) => {
	const { isRead, userId, userNotificationIds, manuallySetIsRead } = options;
	const [updatedCount] = await UserNotification.update(
		{ isRead, manuallySetIsRead },
		{
			where: {
				userId,
				id: { [Op.in]: userNotificationIds },
			},
		},
	);
	return updatedCount;
};

export const deleteUserNotifications = async (options: DeleteOptions) => {
	const { userId, userNotificationIds } = options;
	const destroyedCount = await UserNotification.destroy({
		where: { userId, id: { [Op.in]: userNotificationIds } },
	});
	return destroyedCount;
};
