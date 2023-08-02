import { ActivityItem } from 'server/models';
import { defer } from 'server/utils/deferred';
import { createNotificationsForActivityItem } from 'server/userNotification';

ActivityItem.afterCreate((item) => {
	defer(() => createNotificationsForActivityItem(item));
});
