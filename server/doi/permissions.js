import { getScopeData } from '../utils/scopeData';

export const getPermissions = async ({ pubId, collectionId, userId, communityId }) => {
	if (!userId) {
		return {};
	}

	const scopeData = await getScopeData({
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
