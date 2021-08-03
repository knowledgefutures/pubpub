import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { muteUserSubscription } from '../shared/queries';
import { createUserThreadSubscription } from './queries';

const unwrapPostRequest = (req: any) => {
	return {
		threadId: req.body.threadId as string,
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
	'/api/threads/subscriptions',
	wrap(async (req, res) => {
		const { threadId, userId } = unwrapPostRequest(req);
		const result = await createUserThreadSubscription({
			threadId,
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
	'/api/threads/subscriptions',
	wrap(async (req, res) => {
		const { threadId, userId, muted } = unwrapPutRequest(req);
		await muteUserSubscription({ threadId, userId, muted });
		return res.status(200).json({});
	}),
);
