import {
	createMemberCreatedActivityItem,
	createMemberRemovedActivityItem,
	createMemberUpdatedActivityItem,
} from 'server/activityItem/queries';
import { Member } from 'server/models';
import { getOrCreateUserNotificationPreferences } from 'server/userNotificationPreferences/queries';
import { setUserSubscriptionStatus } from 'server/userSubscription/queries';
import { createActivityHooks } from 'server/utils/activityHooks';

Member.afterCreate(async (member) => {
	const { userId, pubId } = member;

	if (pubId) {
		const userNotificationPreferences = await getOrCreateUserNotificationPreferences(userId);
		if (userNotificationPreferences.subscribeToPubsAsMember) {
			await setUserSubscriptionStatus({
				userId,
				pubId,
				status: 'active',
				setAutomatically: true,
			});
		}
	}
});

createActivityHooks({
	Model: Member,
	onModelCreated: createMemberCreatedActivityItem,
	onModelUpdated: createMemberUpdatedActivityItem,
	onModelDestroyed: createMemberRemovedActivityItem,
});
