import {
	createPubDiscussionCommentAddedActivityItem,
	createPubReviewCommentAddedActivityItem,
} from 'server/activityItem/queries';
import { ThreadComment } from 'server/models';
import { getParentModelForThread } from 'server/thread/queries';
import { getOrCreateUserNotificationPreferences } from 'server/userNotificationPreferences/queries';
import { setUserSubscriptionStatus } from 'server/userSubscription/queries';
import { defer } from 'server/utils/deferred';

const createActivityItem = async (threadComment: ThreadComment) => {
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

ThreadComment.afterCreate(async (threadComment) => {
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

	defer(async () => {
		await createActivityItem(threadComment);
	});
});
