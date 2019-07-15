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
		const editProps = ['name', 'avatar', 'title', 'order', 'isAuthor', 'roles', 'affiliation'];
		const isAuthenticated = isSuperAdmin || communityAdminData;
		return {
			create: isAuthenticated,
			update: isAuthenticated ? editProps : false,
			destroy: isAuthenticated,
		};
	});
};
