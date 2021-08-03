import { createPageActivityItem, createPageUpdatedActivityItem } from 'server/activityItem/queries';
import { Page } from 'server/models';
import { createActivityHooks } from 'server/utils/activityHooks';

createActivityHooks({
	Model: Page,
	onModelCreated: (actorId, pageId) => createPageActivityItem('page-created', actorId, pageId),
	onModelUpdated: createPageUpdatedActivityItem,
	onModelDestroyed: (actorId, pageId) => createPageActivityItem('page-removed', actorId, pageId),
});
