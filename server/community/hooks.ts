import {
	createCommunityCreatedActivityItem,
	createCommunityUpdatedActivityItem,
} from 'server/activityItem/queries';
import { Community } from 'server/models';
import { addSpamTagToCommunity } from 'server/spamTag/communityQueries';
import { createActivityHooks } from 'server/utils/activityHooks';
import { defer } from 'server/utils/deferred';

createActivityHooks({
	Model: Community,
	onModelCreated: createCommunityCreatedActivityItem,
	onModelUpdated: createCommunityUpdatedActivityItem,
});

Community.afterCreate((community) =>
	defer(async () => {
		await addSpamTagToCommunity(community.id);
	}),
);
Community.afterUpdate((community) =>
	defer(async () => {
		await addSpamTagToCommunity(community.id);
	}),
);
