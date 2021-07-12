import * as types from 'types';
import { ThreadComment } from 'server/models';
import { setUserSubscriptionStatus } from 'server/userSubscription/queries';

ThreadComment.afterCreate(async (threadComment: types.ThreadComment) => {
	await setUserSubscriptionStatus({
		userId: threadComment.userId,
		threadId: threadComment.threadId,
		setAutomatically: true,
		status: 'unchanged',
	});
});
