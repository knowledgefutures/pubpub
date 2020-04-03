import { CommunityAdmin, Collection, PubManager } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ userId, pubId, communityId, collectionId }) => {
	if (!userId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	const isSuperAdmin = checkIfSuperAdmin(userId);
	return Promise.all([
		CommunityAdmin.findOne({ where: { communityId: communityId, userId: userId } }),
		Collection.findOne({ where: { id: collectionId, communityId: communityId } }),
		PubManager.findOne({ where: { pubId: pubId, userId: userId } }),
	]).then(([communityAdminData, collectionData, pubManagerData]) => {
		if (!collectionData) {
			return {};
		}
		const isAuthenticated = isSuperAdmin || communityAdminData || pubManagerData;
		return {
			create: isAuthenticated,
			update: isAuthenticated ? ['rank', 'contextHint'] : false,
			setPrimary: isAuthenticated,
			destroy: isAuthenticated,
		};
	});
};
