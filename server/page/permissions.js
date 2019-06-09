import { CommunityAdmin } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ userId, communityId }) => {
	if (!userId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	const isSuperAdmin = checkIfSuperAdmin(userId);
	return CommunityAdmin.findOne({
		where: { userId: userId, communityId: communityId },
		raw: true,
	}).then((isCommunityAdmin) => {
		const editProps = [
			'title',
			'slug',
			'description',
			'isPublic',
			'layout',
			'avatar',
			'isNarrowWidth',
		];

		const isAuthenticated = isCommunityAdmin || isSuperAdmin;
		return {
			create: isAuthenticated,
			update: isAuthenticated && editProps,
			destroy: isAuthenticated,
		};
	});
};
