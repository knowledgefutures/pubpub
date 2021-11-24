import { Collection } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import {
	createCollectionActivityItem,
	createCollectionUpdatedActivityItem,
} from 'server/activityItem/queries';

createActivityHooks({
	Model: Collection,
	onModelCreated: (actorId, id) =>
		createCollectionActivityItem('collection-created', actorId, id),
	onModelUpdated: createCollectionUpdatedActivityItem,
	onModelDestroyed: (actorId, id) =>
		createCollectionActivityItem('collection-removed', actorId, id),
});
