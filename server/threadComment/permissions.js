import { getScope } from '../utils/queryHelpers';
import { DiscussionNew, Thread, ThreadComment } from '../models';

const userEditableFields = ['text', 'content'];

export const getPermissions = async ({
	userId,
	discussionId,
	threadId,
	threadCommentId,
	pubId,
	communityId,
	accessHash,
}) => {
	if (!userId) {
		return {};
	}

	const scopeData = await getScope({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
		accessHash: accessHash,
	});
	const discussionData = await DiscussionNew.findOne({
		where: { id: discussionId, threadId: threadId },
	});
	if (!discussionData || discussionData.pubId !== pubId) {
		return {};
	}
	const threadData = await Thread.findOne({
		where: { id: threadId },
	});
	const threadCommentData = await ThreadComment.findOne({
		where: { id: threadCommentId },
	});

	const userCreatedComment = threadCommentData && threadCommentData.userId === userId;
	const { canView, canAdmin, canCreateDiscussions } = scopeData.activePermissions;
	return {
		create: !threadData.isLocked && (canView || canCreateDiscussions),
		update: (canAdmin || !!userCreatedComment) && userEditableFields,
	};
};
