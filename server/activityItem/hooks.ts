import { ActivityItem } from 'server/models';
import { createNotificationsForActivityItem } from 'server/userNotification';
import { defer } from 'server/utils/deferred';

ActivityItem.afterCreate((item) => {
	defer(() => createNotificationsForActivityItem(item));
});
