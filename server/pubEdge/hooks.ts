import { createPubEdgeActivityItem } from 'server/activityItem/queries';
import { PubEdge } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';

createActivityHooks({
	Model: PubEdge,
	onModelCreated: (actorId, id) => createPubEdgeActivityItem('pub-edge-created', actorId, id),
	onModelDestroyed: (actorId, id) => createPubEdgeActivityItem('pub-edge-removed', actorId, id),
});
