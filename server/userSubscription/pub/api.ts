import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { muteUserSubscription } from '../shared/queries';
import { createUserPubSubscription } from './queries';

const unwrapPostRequest = (req: any) => {
	return {
		pubId: req.body.pubId as string,
		userId: req.user?.id as string,
	};
};

const unwrapPutRequest = (req: any) => {
	return {
		...unwrapPostRequest(req),
		muted: req.body.muted as boolean,
	};
};

app.post(
	'/api/pubs/subscriptions',
	wrap(async (req, res) => {
		const { pubId, userId } = unwrapPostRequest(req);
		const result = await createUserPubSubscription({
			pubId,
			userId,
			createdAutomatically: false,
		});
		if (result) {
			return res.status(200).json(result);
		}
		throw new ForbiddenError();
	}),
);

app.put(
	'/api/pubs/subscriptions',
	wrap(async (req, res) => {
		const { pubId, userId, muted } = unwrapPutRequest(req);
		await muteUserSubscription({ pubId, userId, muted });
		return res.status(200).json({});
	}),
);
