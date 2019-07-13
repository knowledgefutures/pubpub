import { CommunityAdmin, Page } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ userId, communityId, pageId }) => {
	if (!userId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	const isSuperAdmin = checkIfSuperAdmin(userId);
	return Promise.all([
		CommunityAdmin.findOne({ where: { userId: userId, communityId: communityId } }),
		Page.findOne({ where: { id: pageId, communityId: communityId } }),
	]).then(([isCommunityAdmin, pageData]) => {
		const isAuthenticated = isCommunityAdmin || isSuperAdmin;
		if (!pageData) {
			return { created: isAuthenticated };
		}
		const editProps = [
			'title',
			'slug',
			'description',
			'isPublic',
			'layout',
			'avatar',
			'isNarrowWidth',
		];

		return {
			create: isAuthenticated,
			update: isAuthenticated && editProps,
			destroy: isAuthenticated,
		};
	});
};
