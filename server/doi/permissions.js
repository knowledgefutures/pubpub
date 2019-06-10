import { PubManager, CommunityAdmin } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ pubId, userId, communityId }) => {
	if (!userId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	const isSuperAdmin = checkIfSuperAdmin(userId);

	const findPubManager = PubManager.findOne({
		where: { userId: userId, pubId: pubId },
		raw: true,
	});

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: { userId: userId, communityId: communityId },
		raw: true,
	});

	return Promise.all([findPubManager, findCommunityAdmin]).then(
		([isPubManager, isCommunityAdmin]) => {
			return {
				pub: isSuperAdmin || isCommunityAdmin || isPubManager,
				collection: isSuperAdmin || isCommunityAdmin,
			};
		},
	);
};
