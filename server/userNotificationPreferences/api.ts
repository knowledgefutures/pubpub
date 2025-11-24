import type { UserNotificationPreferences } from 'server/models';

import { Router } from 'express';

import { wrap } from 'server/wrap';

import { updateUserNotificationPreferences } from './queries';

export const router = Router();

const unwrapRequest = (req: any) => {
	const { preferences } = req.body;
	return {
		userId: req.user?.id,
		preferences: preferences as Partial<UserNotificationPreferences>,
	};
};

router.put(
	'/api/userNotificationPreferences',
	wrap(async (req, res) => {
		const { userId, preferences } = await unwrapRequest(req);
		await updateUserNotificationPreferences({ userId, preferences });
		return res.status(200).json({});
	}),
);
