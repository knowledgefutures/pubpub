import Bluebird from 'bluebird';

import * as types from 'types';
import { UserSubscription } from 'server/models';
import { canUserSeeThread } from 'server/thread/queries';

import {
	createUserSubscription,
	destroyUserSubscription,
	findUserSubscription,
} from '../shared/queries';

type QueryOptions = {
	userId: string;
	threadId: string;
};

type CreateOptions = QueryOptions & {
	createdAutomatically: boolean;
};

export const createUserThreadSubscription = async (
	options: CreateOptions,
): Promise<null | types.UserSubscription> => {
	const { userId, threadId, createdAutomatically } = options;
	if (await canUserSeeThread(options)) {
		const existing = await findUserSubscription({ userId, threadId });
		if (existing) {
			return existing;
		}
		return createUserSubscription({ userId, threadId, createdAutomatically });
	}
	return null;
};

export const updateUserThreadSubscriptions = async (threadId: string) => {
	await Bluebird.map(
		await UserSubscription.findAll({
			where: { threadId },
		}),
		async (subscription: types.UserSubscription) => {
			if ('threadId' in subscription && subscription.threadId) {
				const canSubscribe = await canUserSeeThread(subscription);
				if (!canSubscribe) {
					await destroyUserSubscription({ id: subscription.id });
				}
			}
		},
		{ concurrency: 5 },
	);
};
