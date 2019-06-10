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
			return {
				create: isAuthenticated,
				update: isAuthenticated ? ['rank', 'contextHint'] : false,
				setPrimary: isAuthenticated,
				destroy: isAuthenticated,
			};
		},
	);
};
