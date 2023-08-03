import * as types from 'types';
import { Member } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import {
	createMemberCreatedActivityItem,
	createMemberUpdatedActivityItem,
	createMemberRemovedActivityItem,
} from 'server/activityItem/queries';
import { setUserSubscriptionStatus } from 'server/userSubscription/queries';
import { getOrCreateUserNotificationPreferences } from 'server/userNotificationPreferences/queries';

Member.afterCreate(async (member: types.Member) => {
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
