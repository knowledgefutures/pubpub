import { PubAttribution } from 'server/models';
import { setUserSubscriptionStatus } from 'server/userSubscription/queries';
import { getOrCreateUserNotificationPreferences } from 'server/userNotificationPreferences/queries';
import { schedulePurge } from 'server/server';
import { defer } from 'server/utils/deferred';

PubAttribution.afterCreate(async (attribution) => {
	const { userId, pubId } = attribution;
	if (!userId) {
		return;
	}

	defer(async () => {
		// refresh all the user pages that have this pub
		await schedulePurge(userId);
	});

	const userNotificationPreferences = await getOrCreateUserNotificationPreferences(userId);
	if (userNotificationPreferences.subscribeToPubsAsContributor) {
		await setUserSubscriptionStatus({
			userId,
			pubId,
			status: 'active',
			setAutomatically: true,
		});
	}
});
