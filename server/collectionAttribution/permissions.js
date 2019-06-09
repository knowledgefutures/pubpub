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
			const editProps = [
				'name',
				'avatar',
				'title',
				'order',
				'isAuthor',
				'roles',
				'affiliation',
			];
			const isAuthenticated = isSuperAdmin || communityAdminData;
			return {
				create: isAuthenticated,
				update: isAuthenticated ? editProps : false,
				destroy: isAuthenticated,
			};
		},
	);
};
