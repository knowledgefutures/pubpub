import Bluebird from 'bluebird';

import * as types from 'types';
import { UserSubscription } from 'server/models';
import { canUserSeeThread } from 'server/thread/queries';

import { destroyUserSubscription } from '../shared/queries';

export const updateUserThreadSubscriptions = async (threadId: string) => {
	await Bluebird.map(
		await UserSubscription.findAll({
			where: { threadId },
		}),
		async (subscription: types.UserSubscription) => {
			if (typeof subscription.threadId === 'string') {
				const canSubscribe = await canUserSeeThread({
					threadId: subscription.threadId,
					userId: subscription.userId,
				});
				if (!canSubscribe) {
					await destroyUserSubscription({ id: subscription.id });
				}
			}
		},
		{ concurrency: 5 },
	);
};
