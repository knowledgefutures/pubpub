import app, { wrap } from 'server/server';
import { canUserSeeThread } from 'server/thread/queries';
import { ForbiddenError } from 'server/utils/errors';
import { UserSubscriptionStatus } from 'types';

import { setUserSubscriptionStatus } from '../shared/queries';

const unwrapRequest = (req: any) => {
	return {
		userId: req.user?.id as string,
		threadId: req.body.threadId as string,
		status: req.body.status as UserSubscriptionStatus,
	};
};

app.put(
	'/api/threads/subscriptions',
	wrap(async (req, res) => {
		const { threadId, userId, status } = unwrapRequest(req);
		if (await canUserSeeThread({ userId, threadId })) {
			const result = await setUserSubscriptionStatus({
				threadId,
				userId,
				status,
				setAutomatically: false,
			});
			return res.status(200).json(result);
		}
		throw new ForbiddenError();
	}),
);
