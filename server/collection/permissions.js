import { CommunityAdmin } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ userId, communityId }) => {
	if (!userId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	const isSuperAdmin = checkIfSuperAdmin(userId);
	return CommunityAdmin.findOne({ where: { communityId: communityId, userId: userId } }).then(
		(communityAdminData) => {
			const isAuthenticated = isSuperAdmin || communityAdminData;
			const editProps = ['title', 'isRestricted', 'isPublic', 'pageId', 'metadata'];
			return {
				create: isAuthenticated,
				update: isAuthenticated ? editProps : false,
				destroy: isAuthenticated,
			};
		},
	);
};
