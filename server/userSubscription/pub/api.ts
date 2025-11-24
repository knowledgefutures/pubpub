import type { UserSubscriptionStatus } from 'types';

import { Router } from 'express';

import { wrap } from 'server/wrap';

import { setUserSubscriptionStatus } from '../shared/queries';

export const router = Router();

const unwrapRequest = (req: any) => {
	return {
		userId: req.user?.id as string,
		pubId: req.body.pubId as string,
		status: req.body.status as UserSubscriptionStatus,
	};
};

router.put(
	'/api/pubs/subscriptions',
	wrap(async (req, res) => {
		const { pubId, userId, status } = unwrapRequest(req);
		const result = await setUserSubscriptionStatus({
			pubId,
			userId,
			status,
			setAutomatically: false,
		});
		return res.status(200).json(result);
	}),
);
