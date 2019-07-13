import { Discussion, Pub, CommunityAdmin, PubManager } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ discussionId, pubId, userId, communityId }) => {
	if (!userId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	const isSuperAdmin = checkIfSuperAdmin(userId);

	// Find if the user is allowed to admin this pub
	const findPubManager = PubManager.findOne({
		where: { userId: userId, pubId: pubId },
		raw: true,
	});

	// Find if the user is admins of the community the pub is in
	const findCommunityAdmin = CommunityAdmin.findOne({
		where: { userId: userId, communityId: communityId },
		raw: true,
	});

	// Find if community admins are allowed to manage pubs
	const findPub = Pub.findOne({
		where: { id: pubId, communityId: communityId },
		raw: true,
	});

	// Find if the user is the author of the discussion
	const findDiscussion = Discussion.findOne({
		where: { id: discussionId, userId: userId },
		raw: true,
	});

	return Promise.all([findPubManager, findCommunityAdmin, findPub, findDiscussion]).then(
		([isPubManager, isCommunityAdmin, pubData, isDiscussionAuthor]) => {
			if (!pubData) {
				return {};
			}
			const editProps =
				isSuperAdmin ||
				isPubManager ||
				(isCommunityAdmin && pubData.isCommunityAdminManaged) ||
				isDiscussionAuthor
					? ['title', 'content', 'text', 'isArchived', 'highlights', 'labels']
					: false;

			return {
				create: true,
				update: editProps,
			};
		},
	);
};
