import { getScope } from '../utils/queryHelpers';
import { DiscussionNew } from '../models';

const userEditableFields = ['title', 'isClosed', 'labels'];

export const getPermissions = async ({
	discussionId,
	userId,
	pubId,
	communityId,
	accessHash,
	visibilityAccess,
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
		where: { id: discussionId, pubId: pubId },
	});

	const { canView, canAdmin, canCreateDiscussions } = scopeData.activePermissions;
	const nonMembersVisibility = visibilityAccess && visibilityAccess !== 'members';

	return {
		create: canView || (canCreateDiscussions && nonMembersVisibility),
		update: canAdmin && discussionData && userEditableFields,
	};
};
