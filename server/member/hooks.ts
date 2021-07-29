import { Member } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import {
	createMemberCreatedActivityItem,
	createMemberUpdatedActivityItem,
	createMemberRemovedActivityItem,
} from 'server/activityItem/queries';

createActivityHooks({
	Model: Member,
	onModelCreated: createMemberCreatedActivityItem,
	onModelUpdated: createMemberUpdatedActivityItem,
	onModelDestroyed: createMemberRemovedActivityItem,
});
