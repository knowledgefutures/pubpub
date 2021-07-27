import { Op } from 'sequelize';

import * as types from 'types';
import { ActivityItem, UserNotification, UserSubscription } from 'server/models';
import { fetchAssociationsForActivityItems } from 'server/activityItem/fetch';
import { getOrCreateUserNotificationPreferences } from 'server/userNotificationPreferences/queries';

type FetchOptions = {
	userId: string;
	offset?: number;
	limit?: number;
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

export const fetchUserNotifications = async (
	options: FetchOptions,
): Promise<types.UserNotificationsFetchResult> => {
	const { userId, offset = 0, limit = 50 } = options;
	const [maybeUnreadNotifications, readNotifications] = await Promise.all([
		offset === 0 &&
			UserNotification.findAll({
				where: { userId, isRead: false },
				include: [{ model: ActivityItem, as: 'activityItem' }],
				order: [['createdAt', 'DESC']],
			}),
		UserNotification.findAll({
			where: { userId, isRead: true },
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

	const [subscriptions, associations, notificationPreferences] = await Promise.all([
		UserSubscription.findAll({
			where: {
				userId,
				id: { [Op.in]: [...new Set(allNotifications.map((n) => n.userSubscriptionId))] },
			},
		}),
		fetchAssociationsForActivityItems(
			allNotifications.map((notification) => notification.activityItem),
		),
		getOrCreateUserNotificationPreferences(userId),
	]);
	return {
		notifications: allNotifications.map((n) => n.toJSON()),
		associations,
		subscriptions,
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
