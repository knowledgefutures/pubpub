import { DiscussionNew, Thread, ThreadComment, ReviewNew, Visibility } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

const userEditableFields = ['text', 'content'];

const getMatchingDiscussion = (id, threadId, pubId) =>
	DiscussionNew.findOne({
		where: { id: id, threadId: threadId, pubId: pubId },
		include: [{ model: Visibility, as: 'visibility' }],
	});

const getMatchingReview = (id, threadId, pubId) =>
	ReviewNew.findOne({
		where: { id: id, threadId: threadId, pubId: pubId },
		include: [{ model: Visibility, as: 'visibility' }],
	});

const canUserInteractWithParent = (parent, canView) => {
	const { visibility } = parent;
	if (visibility.access === 'public') {
		return true;
	}
	if (visibility.access === 'members') {
		return canView;
	}
	return false;
};

export const getPermissions = async ({
	userId,
	parentId,
	threadId,
	threadCommentId,
	pubId,
	communityId,
	accessHash,
}) => {
	if (!userId) {
		return {};
	}

	const [
		scopeData,
		discussionData,
		reviewData,
		threadData,
		threadCommentData,
	] = await Promise.all([
		getScope({
			communityId: communityId,
			pubId: pubId,
			loginId: userId,
			accessHash: accessHash,
		}),
		getMatchingDiscussion(parentId, threadId, pubId),
		getMatchingReview(parentId, threadId, pubId),
		Thread.findOne({ where: { id: threadId } }),
		threadCommentId &&
			ThreadComment.findOne({ where: { id: threadCommentId, threadId: threadId } }),
	]);

	const { canView, canAdmin } = scopeData.activePermissions;
	const notAssociatedWithModel = !reviewData && !discussionData;
	const invalidThreadCommentId = threadCommentId && !threadCommentData;
	const invalidThread = !threadData;

	if (notAssociatedWithModel || invalidThreadCommentId || invalidThread) {
		return {};
	}

	const canInteractWithParent = canUserInteractWithParent(discussionData || reviewData, canView);
	const userCreatedComment = threadCommentData && threadCommentData.userId === userId;

	return {
		create: !threadData.isLocked && (canView || canInteractWithParent),
		update: (canAdmin || !!userCreatedComment) && userEditableFields,
	};
};
