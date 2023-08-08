import { Visibility } from 'server/models';
import { updateUserThreadSubscriptions } from 'server/userSubscription/queries';

import { getParentModelForVisibility } from './queries';

Visibility.afterUpdate(async (visibility) => {
	if (visibility.access !== 'public') {
		const parent = await getParentModelForVisibility(visibility.id);
		if (parent) {
			await updateUserThreadSubscriptions(parent.value.threadId);
		}
	}
});
