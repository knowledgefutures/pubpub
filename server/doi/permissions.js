import { getScope } from '../utils/queryHelpers';

export const getPermissions = async ({ pubId, collectionId, userId, communityId }) => {
	if (!userId) {
		return {};
	}

	const scopeData = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		pubId: pubId,
		loginId: userId,
	});

	return {
		pub: scopeData.activePermissions.isAdmin,
		collection: scopeData.activePermissions.isAdmin,
	};
};
