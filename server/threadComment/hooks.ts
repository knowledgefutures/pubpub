import * as types from 'types';
import { ThreadComment } from 'server/models';
import { createUserThreadSubscription } from 'server/userSubscription/queries';
import { defer } from 'server/utils/deferred';
import { getParentModelForThread } from 'server/thread/queries';
import {
	createPubDiscussionCommentAddedActivityItem,
	createPubReviewCommentAddedActivityItem,
} from 'server/activityItem/queries';

ThreadComment.afterCreate(async (threadComment: types.ThreadComment) => {
	await createUserThreadSubscription({
		userId: threadComment.userId,
		threadId: threadComment.threadId,
		createdAutomatically: true,
	});
	defer(async () => {
		const { threadId } = threadComment;
		const parent = await getParentModelForThread(threadId);
		if (parent?.type === 'discussion') {
			const numberOfCommentsInThread = ThreadComment.count({ where: { threadId } });
			await createPubDiscussionCommentAddedActivityItem(
				parent.value.id,
				threadComment.id,
				numberOfCommentsInThread > 1,
			);
		}
		if (parent?.type === 'review') {
			await createPubReviewCommentAddedActivityItem(parent.value.id, threadComment.id);
		}
	});
});
