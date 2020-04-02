import { getScope } from '../utils/queryHelpers';

const editableFields = ['name', 'avatar', 'title', 'order', 'isAuthor', 'roles', 'affiliation'];

export const getPermissions = async ({ userId, communityId, pubId }) => {
	if (!userId) {
		return {};
	}

	const {
		activePermissions: { canManage },
	} = await getScope({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
	});

	return {
		create: canManage,
		update: canManage ? editableFields : false,
		destroy: canManage,
	};
};
