import {
	createCollectionActivityItem,
	createCollectionUpdatedActivityItem,
} from 'server/activityItem/queries';
import { Collection } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';

createActivityHooks({
	Model: Collection,
	onModelCreated: (actorId, id) =>
		createCollectionActivityItem('collection-created', actorId, id),
	onModelUpdated: createCollectionUpdatedActivityItem,
	onModelDestroyed: (actorId, id) =>
		createCollectionActivityItem('collection-removed', actorId, id),
});
