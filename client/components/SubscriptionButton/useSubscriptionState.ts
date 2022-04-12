import { useState } from 'react';

import { UserSubscription, UserSubscriptionStatus, UserSubscriptionTarget } from 'types';
import { apiFetch } from 'client/utils/apiFetch';

export type SubscriptionStateOptions = {
	target: UserSubscriptionTarget;
	subscription: null | UserSubscription;
	parentSubscription?: null | UserSubscription;
	onUpdateSubscription: (s: UserSubscription) => unknown;
};

const getSubscriptionStatus = (subscription: null | UserSubscription) => {
	if (subscription) {
		return subscription.status;
	}
	return 'inactive';
};

export const useSubscriptionState = (options: SubscriptionStateOptions) => {
	const { subscription, parentSubscription = null, target, onUpdateSubscription } = options;
	const [isLoading, setIsLoading] = useState(false);
	const status = getSubscriptionStatus(subscription);
	const parentStatus = getSubscriptionStatus(parentSubscription);

	const updateStatus = async (nextStatus: UserSubscriptionStatus) => {
		setIsLoading(true);
		if ('pubId' in target) {
			onUpdateSubscription(
				await apiFetch.put('/api/pubs/subscriptions', {
					pubId: target.pubId,
					status: nextStatus,
				}),
			);
		}
		if ('threadId' in target) {
			onUpdateSubscription(
				await apiFetch.put('/api/threads/subscriptions', {
					threadId: target.threadId,
					status: nextStatus,
				}),
			);
		}
		setIsLoading(false);
	};

	return { status, parentStatus, updateStatus, isLoading };
};
