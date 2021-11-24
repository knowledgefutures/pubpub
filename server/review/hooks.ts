import { ReviewNew } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import {
	createPubReviewCreatedActivityItem,
	createPubReviewUpdatedActivityItem,
} from 'server/activityItem/queries';

createActivityHooks({
	Model: ReviewNew,
	onModelCreated: (_, id) => createPubReviewCreatedActivityItem(id),
	onModelUpdated: createPubReviewUpdatedActivityItem,
});
