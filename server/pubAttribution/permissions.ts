import { getScope } from 'server/utils/queryHelpers';

const editableFields = [
	'affiliation',
	'avatar',
	'isAuthor',
	'name',
	'orcid',
	'order',
	'roles',
	'title',
];

export const getPermissions = async ({ userId, communityId, pubId }) => {
	if (!userId) {
		return {};
	}

	const {
		activePermissions: { canManage },
	} = await getScope({
		communityId,
		pubId,
		loginId: userId,
	});

	return {
		create: canManage,
		update: canManage ? editableFields : false,
		destroy: canManage,
	};
};
