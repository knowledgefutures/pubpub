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
		if (!collectionData) {
			return {};
		}
		const isAuthenticated = isSuperAdmin || communityAdminData;
		return {
			create: isAuthenticated,
			update: isAuthenticated ? ['rank', 'contextHint'] : false,
			setPrimary: isAuthenticated,
			destroy: isAuthenticated,
		};
	});
};
