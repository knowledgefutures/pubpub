import { Pub, PubManager, CommunityAdmin } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ userId, communityId, pubId }) => {
	if (!userId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	const isSuperAdmin = checkIfSuperAdmin(userId);
	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: communityId,
			userId: userId,
		},
	});
	const findPubManager = PubManager.findOne({
		where: {
			pubId: pubId,
			userId: userId,
		},
	});
	const findPub = Pub.findOne({
		where: {
			id: pubId,
			isCommunityAdminManaged: true,
		},
		attributes: ['id', 'isCommunityAdminManaged'],
	});
	return Promise.all([findCommunityAdmin, findPubManager, findPub]).then(
		([communityAdminData, pubManagerData, pubData]) => {
			const authenticated = isSuperAdmin || (communityAdminData && pubData) || pubManagerData;
			const editProps = [
				'name',
				'avatar',
				'title',
				'order',
				'isAuthor',
				'roles',
				'affiliation',
			];
			return {
				create: authenticated,
				update: authenticated ? editProps : false,
				destroy: authenticated,
			};
		},
	);
};
