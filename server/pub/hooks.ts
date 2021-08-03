import { Pub } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import { createPubActivityItem, createPubUpdatedActivityItem } from 'server/activityItem/queries';

createActivityHooks({
	Model: Pub,
	onModelCreated: (actorId, id) => createPubActivityItem('pub-created', actorId, id),
	onModelUpdated: createPubUpdatedActivityItem,
	onModelDestroyed: (actorId, id) => createPubActivityItem('pub-removed', actorId, id),
});
