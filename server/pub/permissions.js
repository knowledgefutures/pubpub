import { getScope } from '../utils/queryHelpers';

export const getPermissions = async ({ userId, communityId, pubId, licenseSlug }) => {
	if (!userId || !communityId) {
		return {};
	}

	const scopeData = await getScope({
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
