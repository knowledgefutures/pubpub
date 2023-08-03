import { Community } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import {
	createCommunityCreatedActivityItem,
	createCommunityUpdatedActivityItem,
} from 'server/activityItem/queries';
import { defer } from 'server/utils/deferred';
import { addSpamTagToCommunity } from 'server/spamTag/queries';

createActivityHooks({
	Model: Community,
	onModelCreated: createCommunityCreatedActivityItem,
	onModelUpdated: createCommunityUpdatedActivityItem,
});

Community.afterCreate((community) => defer(() => addSpamTagToCommunity(community.id)));
Community.afterUpdate((community) => defer(() => addSpamTagToCommunity(community.id)));
