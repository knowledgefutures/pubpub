import { getScope } from '../utils/queryHelpers';
import { ThreadComment } from '../models';

const userEditableFields = ['title', 'content', 'text', 'isClosed', 'highlights', 'labels'];

export const getPermissions = async ({
	// branchId,
	// threadId,
	threadCommentId,
	userId,
	pubId,
	collectionId,
	communityId,
	accessHash,
}) => {
	if (!userId) {
		return {};
	}

	const scopeData = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		pubId: pubId,
		loginId: userId,
		accessHash: accessHash,
	});

	let commentItem;
	if (threadCommentId) {
		commentItem = await ThreadComment.findOne({
			where: { id: threadCommentId },
			raw: true,
		});
	}

	const userCreatedComment = commentItem && commentItem.userId === userId;
	const { canView, canAdmin, canCreateDiscussions } = scopeData.activePermissions;
	return {
		create: canView || canCreateDiscussions,
		update: (canAdmin || !!userCreatedComment) && userEditableFields,
	};
};
