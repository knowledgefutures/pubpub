import { CommunityAdmin, Collection } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ userId, communityId, collectionId }) => {
	if (!userId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	const isSuperAdmin = checkIfSuperAdmin(userId);
	return Promise.all([
		CommunityAdmin.findOne({ where: { communityId: communityId, userId: userId } }),
		Collection.findOne({ where: { id: collectionId, communityId: communityId } }),
	]).then(([communityAdminData, collectionData]) => {
		const isAuthenticated = isSuperAdmin || communityAdminData;
		if (!collectionData) {
			return { create: isAuthenticated };
		}

		const editProps = ['title', 'isRestricted', 'isPublic', 'pageId', 'metadata'];
		return {
			create: isAuthenticated,
			update: isAuthenticated ? editProps : false,
			destroy: isAuthenticated,
		};
	});
};
