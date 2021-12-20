import { Submission } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import {
	createSubmissionActivityItem,
	createSubmissionStatusChangedActivityItem,
} from 'server/activityItem/queries';

createActivityHooks({
	Model: Submission,
	onModelCreated: (actorId, id) =>
		createSubmissionActivityItem('submission-created', actorId, id),
	onModelUpdated: createSubmissionStatusChangedActivityItem,
	onModelDestroyed: (actorId, id) =>
		createSubmissionActivityItem('submission-deleted', actorId, id),
});
