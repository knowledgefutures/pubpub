import * as types from 'types';
import { ThreadComment } from 'server/models';
import { defer } from 'server/utils/deferred';
import { getParentModelForThread } from 'server/thread/queries';
import {
	createPubDiscussionCommentAddedActivityItem,
	createPubReviewCommentAddedActivityItem,
} from 'server/activityItem/queries';
import { setUserSubscriptionStatus } from 'server/userSubscription/queries';
import { getOrCreateUserNotificationPreferences } from 'server/userNotificationPreferences/queries';

const createActivityItem = async (threadComment: types.ThreadComment) => {
	const parent = await getParentModelForThread(threadComment.threadId);
	if (parent) {
		if (parent.type === 'discussion') {
			const { value: discussion } = parent;
			const numberOfCommentsInThread = await ThreadComment.count({
				where: { threadId: threadComment.threadId },
			});
			const isReply = numberOfCommentsInThread > 1;
			return createPubDiscussionCommentAddedActivityItem(
				discussion.id,
				threadComment.id,
				isReply,
			);
		}
		if (parent.type === 'review') {
			const { value: review } = parent;
			return createPubReviewCommentAddedActivityItem(review.id, threadComment.id);
		}
	}
	return null;
};

ThreadComment.afterCreate(async (threadComment: types.ThreadComment) => {
	const { userId, threadId } = threadComment;
	if (userId) {
		const userNotificationPreferences = await getOrCreateUserNotificationPreferences(userId);
		if (userNotificationPreferences.subscribeToThreadsAsCommenter) {
			await setUserSubscriptionStatus({
				userId,
				threadId,
				setAutomatically: true,
				status: 'unchanged',
			});
		}
	}

	defer(() => createActivityItem(threadComment));
});
