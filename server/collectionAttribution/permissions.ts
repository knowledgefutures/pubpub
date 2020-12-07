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

export const getPermissions = async ({ userId, communityId, collectionId }) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		loginId: userId,
	});
	const isAuthenticated = scopeData.activePermissions.canManage;
	if (!scopeData.elements.activeCollection) {
		return {};
	}
	return {
		create: isAuthenticated,
		update: isAuthenticated ? editableFields : false,
		destroy: isAuthenticated,
	};
};
