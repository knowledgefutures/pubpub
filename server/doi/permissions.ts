import { Release } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

const pubExistsAndIsMissingReleases = async (pubId) => {
	if (!pubId) {
		return false;
	}
	const releases = await Release.findAll({ where: { pubId: pubId } });
	return releases.length === 0;
};

export const getPermissions = async ({ pubId, collectionId, userId, communityId }) => {
	if (!userId) {
		return {};
	}

	const {
		activePermissions: { canAdminCommunity },
		elements: { activePub },
	} = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		pubId: pubId,
		loginId: userId,
	});

	const missingReleases = await pubExistsAndIsMissingReleases(activePub && activePub.id);

	return {
		pub: canAdminCommunity && !missingReleases,
		collection: canAdminCommunity,
	};
};
