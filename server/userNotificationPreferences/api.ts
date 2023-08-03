import * as types from 'types';
import app, { wrap } from 'server/server';

import { updateUserNotificationPreferences } from './queries';

const unwrapRequest = (req: any) => {
	const { preferences } = req.body;
	return {
		userId: req.user?.id,
		preferences: preferences as Partial<types.UserNotificationPreferences>,
	};
};

app.put(
	'/api/userNotificationPreferences',
	wrap(async (req, res) => {
		const { userId, preferences } = await unwrapRequest(req);
		await updateUserNotificationPreferences({ userId, preferences });
		return res.status(200).json({});
	}),
);
