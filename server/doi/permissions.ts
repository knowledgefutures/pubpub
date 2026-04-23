import { Community, SpamTag } from 'server/models';
import { ForbiddenError } from 'server/utils/errors';
import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ pubId, collectionId, userId, communityId }) => {
	if (!userId) {
		return {};
	}

	const {
		activePermissions: { canAdminCommunity },
	} = await getScope({
		communityId,
		collectionId,
		pubId,
		loginId: userId,
	});

	return {
		pub: canAdminCommunity,
		collection: canAdminCommunity,
	};
};

export const assertCommunityApprovedForDoi = async (communityId: string) => {
	const community = await Community.findByPk(communityId, {
		include: [{ model: SpamTag, as: 'spamTag' }],
	});
	if (community?.spamTag && community.spamTag.status !== 'confirmed-not-spam') {
		throw new ForbiddenError(
			new Error('DOI minting is not available until your community has been approved.'),
		);
	}
};
