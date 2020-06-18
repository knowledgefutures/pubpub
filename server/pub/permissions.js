import { getScope } from 'server/utils/queryHelpers';

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
		'draftPermissions',
		'labels',
		'downloads',
		'licenseSlug',
		'citationStyle',
		'citationInlineStyle',
	];
	return {
		create: true,
		update: canManage ? editProps : false,
		destroy: canManage,
	};
};
