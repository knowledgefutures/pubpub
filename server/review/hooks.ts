import {
	createPubReviewCreatedActivityItem,
	createPubReviewUpdatedActivityItem,
} from 'server/activityItem/queries';
import { ReviewNew } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';

createActivityHooks({
	Model: ReviewNew,
	onModelCreated: (_, id) => createPubReviewCreatedActivityItem(id),
	onModelUpdated: createPubReviewUpdatedActivityItem,
});
