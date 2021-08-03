import { PubEdge } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';
import { createPubEdgeActivityItem } from 'server/activityItem/queries';

createActivityHooks({
	Model: PubEdge,
	onModelCreated: (actorId, id) => createPubEdgeActivityItem('pub-edge-created', actorId, id),
	onModelDestroyed: (actorId, id) => createPubEdgeActivityItem('pub-edge-removed', actorId, id),
});
