import type { DiscussionCreationAccess } from 'types/community';

import { PublicPermissions } from './model';

export const updateDiscussionCreationAccess = async ({
	communityId,
	discussionCreationAccess,
}: {
	communityId: string;
	discussionCreationAccess: DiscussionCreationAccess;
}) => {
	const publicPermissions = await PublicPermissions.findOne({ where: { communityId } });
	if (!publicPermissions) {
		await PublicPermissions.create({ communityId, discussionCreationAccess });
		return;
	}
	publicPermissions.discussionCreationAccess = discussionCreationAccess;
	await publicPermissions.save();
};
