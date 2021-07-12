import { UserSubscription } from 'server/models';
import * as types from 'types';

type SetStatusOptions = types.UniqueUserSubscriptionQuery & {
	id?: never;
	setAutomatically: boolean;
	status: 'unchanged' | types.UserSubscriptionStatus;
};

export const findUserSubscription = async (
	where: types.UniqueUserSubscriptionQuery,
): Promise<null | types.SequelizeModel<types.UserSubscription>> => {
	return UserSubscription.findOne({ where });
};

export const setUserSubscriptionStatus = async (
	options: SetStatusOptions,
): Promise<types.SequelizeModel<types.UserSubscription>> => {
	const { setAutomatically, status, ...where } = options;
	const subscription = await findUserSubscription(where);
	if (subscription) {
		subscription.setAutomatically = setAutomatically;
		if (status !== 'unchanged') {
			subscription.status = status;
		}
		await subscription.save();
		return subscription;
	}
	const insertableStatus = status === 'unchanged' ? 'active' : status;
	return UserSubscription.create({ ...where, setAutomatically, status: insertableStatus });
};

export const destroyUserSubscription = async (where: types.UniqueUserSubscriptionQuery) => {
	const subscription = await findUserSubscription(where);
	if (subscription) {
		await subscription.destroy();
	}
};
