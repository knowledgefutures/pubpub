import { Router } from 'express';

import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { wrap } from 'server/wrap';

import {
	deleteUserNotifications,
	fetchUserNotifications,
	markUserNotificationsRead,
} from './queries';

export const router = Router();

const unwrapGetRequest = (req: any) => {
	const { offset, limit } = req.query;
	return {
		userId: req.user?.id as string,
		offset: offset ? parseInt(offset, 10) : 0,
		limit: limit ? parseInt(limit, 10) : 50,
	};
};

const unwrapRequest = (req: any) => {
	return {
		userId: req.user?.id as string,
		userNotificationIds: req.body.userNotificationIds as string[],
	};
};

const unwrapMarkReadRequest = (req: any) => {
	return {
		...unwrapRequest(req),
		isRead: req.body.isRead as boolean,
		manuallySetIsRead: req.body.manuallySetIsRead as boolean,
	};
};

router.get(
	'/api/userNotifications',
	wrap(async (req, res) => {
		const { userId, offset, limit } = unwrapGetRequest(req);
		if (!userId) {
			throw new NotFoundError();
		}
		const result = await fetchUserNotifications({ userId, offset, limit });
		return res.status(200).json(result);
	}),
);

// It would be more appropriate to use PUT here but we need to hit this with the Beacon API
router.post(
	'/api/userNotifications',
	wrap(async (req, res) => {
		const { userId, userNotificationIds, isRead, manuallySetIsRead } =
			unwrapMarkReadRequest(req);
		const markedCount = await markUserNotificationsRead({
			userNotificationIds,
			userId,
			isRead,
			manuallySetIsRead,
		});
		if (markedCount === userNotificationIds.length) {
			return res.status(200).json({});
		}
		throw new ForbiddenError();
	}),
);

router.delete(
	'/api/userNotifications',
	wrap(async (req, res) => {
		const { userId, userNotificationIds } = unwrapRequest(req);
		const deletedCount = await deleteUserNotifications({ userId, userNotificationIds });
		if (deletedCount === userNotificationIds.length) {
			res.status(200).json({});
		}
		throw new ForbiddenError();
	}),
);
