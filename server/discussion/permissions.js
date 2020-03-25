import { getScope } from '../utils/queryHelpers';
import { DiscussionNew } from '../models';

const userEditableFields = ['title', 'isClosed', 'labels'];

export const getPermissions = async ({ discussionId, userId, pubId, communityId, accessHash }) => {
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
		where: { id: discussionId },
	});

	const userCreatedDiscussion = discussionData && discussionData.userId === userId;
	const { canView, canAdmin, canCreateDiscussions } = scopeData.activePermissions;
	return {
		create: canView || canCreateDiscussions,
		update: (canAdmin || !!userCreatedDiscussion) && userEditableFields,
	};
};
