import { Submission } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import { createSubmissionUpdatedActivityItem } from 'server/activityItem/queries';

createActivityHooks({
	Model: Submission,
	onModelUpdated: createSubmissionUpdatedActivityItem,
});
