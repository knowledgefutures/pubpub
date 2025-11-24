import type { UserSubscriptionStatus } from 'types';

import { Router } from 'express';

import { canUserSeeThread } from 'server/thread/queries';
import { ForbiddenError } from 'server/utils/errors';
import { wrap } from 'server/wrap';

import { setUserSubscriptionStatus } from '../shared/queries';

export const router = Router();

const unwrapRequest = (req: any) => {
	return {
		userId: req.user?.id as string,
		threadId: req.body.threadId as string,
		status: req.body.status as UserSubscriptionStatus,
	};
};

router.put(
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
