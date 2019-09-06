import { Pub, PubManager, CommunityAdmin, Community } from '../models';
import { checkIfSuperAdmin } from '../utils';
import { getBranchAccess } from '../branch/permissions';

export const canUserSeePub = (userId, pubData, isCommunityAdmin) =>
	pubData.branches.some((branch) =>
		getBranchAccess(
			null,
			branch,
			userId,
			isCommunityAdmin,
			pubData.managers.some((manager) => manager.userId === userId),
		),
	);

export const getPermissions = ({ userId, communityId, pubId, licenseSlug }) => {
	if (!userId || !communityId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}

	const isSuperAdmin = checkIfSuperAdmin(userId);
	const findPubManager = PubManager.findOne({
		where: {
			userId: userId,
			pubId: pubId,
		},
	});

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			userId: userId,
			communityId: communityId || null,
		},
	});
	const findPub = Pub.findOne({
		where: { id: pubId, communityId: communityId },
		attributes: ['id', 'communityId', 'isCommunityAdminManaged'],
	});
	const findCommunity = Community.findOne({
		where: {
			id: communityId || null,
		},
		attributes: ['id', 'premiumLicenseFlag'],
	});

	return Promise.all([findPubManager, findCommunityAdmin, findPub, findCommunity]).then(
		([pubManagerData, communityAdminData, pubData, communityData]) => {
			const validLicenseSlug =
				!licenseSlug ||
				communityData.premiumLicenseFlag ||
				licenseSlug === 'cc-by' ||
				licenseSlug === 'cc-0';
			const canManage =
				validLicenseSlug &&
				pubData &&
				(isSuperAdmin ||
					pubManagerData ||
					(communityAdminData && pubData.isCommunityAdminManaged));
			const editProps = [
				'slug',
				'title',
				'description',
				'avatar',
				'headerStyle',
				'headerBackgroundType',
				'headerBackgroundColor',
				'headerBackgroundImage',
				'isCommunityAdminManaged',
				'communityAdminDraftPermissions',
				'draftPermissions',
				'labels',
				'downloads',
				'licenseSlug',
			];
			/* TODO: There are open questions about who should */
			/* be able to delete pubs. Does a PubManager have the */
			/* power to delete a pub and everyone else's branches? */
			return {
				create: true,
				update: canManage ? editProps : false,
				destroy: canManage,
			};
		},
	);
};
