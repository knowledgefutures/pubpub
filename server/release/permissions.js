import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, pubId, communityId }) => {
	const {
		activePermissions: { canAdmin },
	} = await getScope({ communityId: communityId, pubId: pubId, loginId: userId });
	return {
		create: canAdmin,
	};
};
