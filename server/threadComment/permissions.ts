import { Pub, Thread, ThreadComment, Discussion, ReviewNew, Visibility } from 'server/models';
import * as types from 'types';
import { getScope } from 'server/utils/queryHelpers';

const getMatchingDiscussion = (id, threadId, pubId) =>
	Discussion.findOne({
		where: { id, threadId, pubId },
		include: [{ model: Visibility, as: 'visibility' }],
	});

const getMatchingReview = (id, threadId, pubId) =>
	ReviewNew.findOne({
		where: { id, threadId, pubId },
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

export const userEditableFields = ['text', 'content'];

export const getPermissions = async ({
	userId,
	parentId,
	threadId,
	threadCommentId,
	pubId,
	communityId,
	accessHash,
	commentAccessHash,
}) => {
	if (!userId && !commentAccessHash) {
		return {};
	}
	const pub: types.Pub = await Pub.findOne({ where: { id: pubId } });
	const hasAccessHash = pub?.commentHash === commentAccessHash;
	const [scopeData, discussionData, reviewData, threadData, threadCommentData] =
		await Promise.all([
			getScope({
				communityId,
				pubId,
				loginId: userId,
				accessHash,
			}),
			getMatchingDiscussion(parentId, threadId, pubId),
			getMatchingReview(parentId, threadId, pubId),
			Thread.findOne({ where: { id: threadId } }),
			threadCommentId && ThreadComment.findOne({ where: { id: threadCommentId, threadId } }),
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
		create: !threadData.isLocked && (canView || canInteractWithParent || hasAccessHash),
		update: (canAdmin || !!userCreatedComment) && userEditableFields,
	};
};
