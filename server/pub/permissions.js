import { getScope } from 'server/utils/queryHelpers';

const managerUpdatableFields = [
	'avatar',
	'citationInlineStyle',
	'citationStyle',
	'customPublishedAt',
	'description',
	'downloads',
	'draftPermissions',
	'headerBackgroundColor',
	'headerBackgroundImage',
	'headerStyle',
	'labels',
	'licenseSlug',
	'slug',
	'title',
];

const adminUpdatableFields = ['doi'];

const isValidLicenseSlugForCommunity = (community, licenseSlug) => {
	return (
		!licenseSlug ||
		community.premiumLicenseFlag ||
		licenseSlug === 'cc-by' ||
		licenseSlug === 'cc-0'
	);
};

export const canCreatePub = async ({ userId, communityId, collectionId }) => {
	const {
		activePermissions: { canManage },
	} = await getScope({ communityId: communityId, collectionId: collectionId, loginId: userId });
	return canManage;
};

export const getUpdatablePubFields = async ({ userId, pubId, licenseSlug }) => {
	const {
		elements: { activeCommunity },
		activePermissions: { canManage, canAdmin },
	} = await getScope({ pubId: pubId, loginId: userId });

	if (!isValidLicenseSlugForCommunity(activeCommunity, licenseSlug)) {
		return null;
	}

	if (canManage) {
		if (canAdmin) {
			return [...managerUpdatableFields, ...adminUpdatableFields];
		}
		return managerUpdatableFields;
	}

	return null;
};

export const canDestroyPub = async ({ userId, pubId }) => {
	const {
		activePermissions: { canManage },
	} = await getScope({ pubId: pubId, loginId: userId });
	return canManage;
};
