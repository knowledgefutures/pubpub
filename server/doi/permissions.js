import { PubManager, CommunityAdmin, Pub, Collection } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ pubId, collectionId, userId, communityId }) => {
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

	const findPub = Pub.findOne({
		where: { id: pubId, communityId: communityId },
		raw: true,
	});

	const findCollection = Collection.findOne({
		where: { id: collectionId, communityId: communityId },
		raw: true,
	});

	return Promise.all([findPubManager, findCommunityAdmin, findPub, findCollection]).then(
		([isPubManager, isCommunityAdmin, pubInCommunity, collectionInCommunity]) => {
			return {
				pub: isSuperAdmin || (isCommunityAdmin && pubInCommunity) || isPubManager,
				collection: isSuperAdmin || (isCommunityAdmin && collectionInCommunity),
			};
		},
	);
};
