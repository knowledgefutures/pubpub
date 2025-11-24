import { createSubmissionUpdatedActivityItem } from 'server/activityItem/queries';
import { Submission } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';

createActivityHooks({
	Model: Submission,
	onModelUpdated: createSubmissionUpdatedActivityItem,
});
