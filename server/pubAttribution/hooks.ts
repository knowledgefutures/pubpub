import { PubAttribution, includeUserModel } from 'server/models';
import { setUserSubscriptionStatus } from 'server/userSubscription/queries';
import { getOrCreateUserNotificationPreferences } from 'server/userNotificationPreferences/queries';
import { createPurgeHooks } from 'utils/caching/createPurgeHooks';

PubAttribution.afterCreate(async (attribution) => {
	const { userId, pubId } = attribution;
	if (!userId) {
		return;
	}

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

createPurgeHooks({
	model: PubAttribution,
	onModelCreated: async (attribution) => {
		if (!attribution.userId) {
			return '';
		}

		const populatedPubAttribution = await PubAttribution.findOne({
			where: { id: attribution.id, userId: attribution.userId },
			include: [includeUserModel({ as: 'user', required: true })],
		});

		return populatedPubAttribution?.user?.slug;
	},
});
