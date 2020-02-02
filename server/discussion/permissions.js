import { getScopeData } from '../utils/scopeData';
import { Discussion } from '../models';

const userEditableFields = ['title', 'content', 'text', 'isArchived', 'highlights', 'labels'];

export const getPermissions = async ({
	branchId,
	discussionId,
	userId,
	pubId,
	collectionId,
	communityId,
}) => {
	if (!userId) {
		return {};
	}

	const scopeData = await getScopeData({
		communityId: communityId,
		collectionId: collectionId,
		pubId: pubId,
		loginId: userId,
	});

	let discussionItem;
	if (discussionId) {
		discussionItem = await Discussion.findOne({
			where: { id: discussionId, branchId: branchId },
			raw: true,
		});
	}

	const userCreatedDiscussion = discussionItem && discussionItem.userId === userId;
	const { canView, canAdmin, isPublicDiscussions } = scopeData.activePermissions;
	return {
		create: canView || isPublicDiscussions,
		update: (canAdmin || !!userCreatedDiscussion) && userEditableFields,
	};
};
