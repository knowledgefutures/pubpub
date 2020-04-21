import { Pub, PubManager, CommunityAdmin } from '../models';
import { checkIfSuperAdmin } from '../utils';

const editProps = ['name', 'avatar', 'title', 'order', 'isAuthor', 'roles', 'affiliation', 'orcid'];

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
			communityId: communityId,
		},
		attributes: ['id', 'communityId', 'isCommunityAdminManaged'],
	});
	return Promise.all([findCommunityAdmin, findPubManager, findPub]).then(
		([communityAdminData, pubManagerData, pubData]) => {
			if (!pubData) {
				return {};
			}
			const authenticated =
				isSuperAdmin ||
				(communityAdminData && pubData.isCommunityAdminManaged) ||
				pubManagerData;

			return {
				create: authenticated,
				update: authenticated ? editProps : false,
				destroy: authenticated,
			};
		},
	);
};
