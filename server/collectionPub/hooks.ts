import { createCollectionPubActivityItem } from 'server/activityItem/queries';
import { CollectionPub } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';

createActivityHooks({
	Model: CollectionPub,
	onModelCreated: (actorId, id) =>
		createCollectionPubActivityItem('collection-pub-created', actorId, id),
	onModelDestroyed: (actorId, id) =>
		createCollectionPubActivityItem('collection-pub-removed', actorId, id),
});
