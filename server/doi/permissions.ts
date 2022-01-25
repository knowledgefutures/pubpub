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
