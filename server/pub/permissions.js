import { getScopeData } from '../utils/scopeData';
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

export const getPermissions = async ({ userId, communityId, pubId, licenseSlug }) => {
	if (!userId || !communityId) {
		return {};
	}

	const scopeData = await getScopeData({
		communityId: communityId,
		pubId: pubId,
		loginId: userId,
	});

	const validLicenseSlug =
		!licenseSlug ||
		scopeData.elements.activeCommunity.premiumLicenseFlag ||
		licenseSlug === 'cc-by' ||
		licenseSlug === 'cc-0';
	const canManage = validLicenseSlug && scopeData.activePermissions.canManage;
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
};
