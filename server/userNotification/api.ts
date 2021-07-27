import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import {
	deleteUserNotifications,
	fetchUserNotifications,
	markUserNotificationsRead,
} from './queries';

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

app.get(
	'/api/userNotifications',
	wrap(async (req, res) => {
		const { userId, offset, limit } = unwrapGetRequest(req);
		const result = await fetchUserNotifications({ userId, offset, limit });
		return res.status(200).json(result);
	}),
);

// It would be more appropriate to use PUT here but we need to hit this with the Beacon API
app.post(
	'/api/userNotifications',
	wrap(async (req, res) => {
		const { userId, userNotificationIds, isRead, manuallySetIsRead } = unwrapMarkReadRequest(
			req,
		);
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

app.delete(
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
