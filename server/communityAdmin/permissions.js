/* eslint-disable prettier/prettier */
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
			return {
				create: isSuperAdmin || communityAdminData,
				destroy: isSuperAdmin || communityAdminData,
			};
		},
	);
};
