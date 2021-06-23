import { UserSubscription } from 'server/models';
import * as types from 'types';

type CreateOptions = types.UniqueUserSubscriptionQuery & {
	id?: never;
	createdAutomatically: boolean;
};

type MuteOptions = types.UniqueUserSubscriptionQuery & { muted: boolean };

export const findUserSubscription = async (
	where: types.UniqueUserSubscriptionQuery,
): Promise<null | types.SequelizeModel<types.UserSubscription>> => {
	return UserSubscription.findOne({ where });
};

export const createUserSubscription = async (
	options: CreateOptions,
): Promise<types.UserSubscription> => {
	const { createdAutomatically, ...associationIds } = options;
	return UserSubscription.create({ createdAutomatically, ...associationIds });
};

export const muteUserSubscription = async (options: MuteOptions) => {
	const { muted, ...where } = options;
	const subscription = await findUserSubscription(where);
	if (subscription) {
		subscription.muted = muted;
		await subscription.save();
	}
};

export const destroyUserSubscription = async (where: types.UniqueUserSubscriptionQuery) => {
	const subscription = await findUserSubscription(where);
	if (subscription) {
		await subscription.destroy();
	}
};
