import * as types from 'types';
import { PubAttribution } from 'server/models';
import { setUserSubscriptionStatus } from 'server/userSubscription/queries';
import { getOrCreateUserNotificationPreferences } from 'server/userNotificationPreferences/queries';

PubAttribution.afterCreate(async (attribution: types.PubAttribution) => {
	const { userId, pubId } = attribution;
	if (userId) {
		const userNotificationPreferences = await getOrCreateUserNotificationPreferences(userId);
		if (userNotificationPreferences.subscribeToPubsAsContributor) {
			await setUserSubscriptionStatus({
				userId,
				pubId,
				status: 'active',
				setAutomatically: true,
			});
		}
	}
});
