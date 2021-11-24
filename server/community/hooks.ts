import { Community } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import {
	createCommunityCreatedActivityItem,
	createCommunityUpdatedActivityItem,
} from 'server/activityItem/queries';

createActivityHooks({
	Model: Community,
	onModelCreated: createCommunityCreatedActivityItem,
	onModelUpdated: createCommunityUpdatedActivityItem,
});
