import { getScope } from '../utils/queryHelpers';

export const getPermissions = async ({ userId, communityId }) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScope({
		communityId: communityId,
		loginId: userId,
	});
	const editProps = [
		'title',
		'subdomain',
		'description',
		'avatar',
		'favicon',
		'accentColorLight',
		'accentColorDark',
		'navigation',
		'website',
		'twitter',
		'facebook',
		'email',
		'hideCreatePubButton',
		'hideNav',
		'defaultPubCollections',
		'headerLogo',
		'headerColorType',
		'useHeaderTextAccent',
		'headerLinks',
		'hideHero',
		'hideHeaderLogo',
		'heroLogo',
		'heroBackgroundImage',
		'heroBackgroundColor',
		'heroTextColor',
		'useHeaderGradient',
		'heroImage',
		'heroTitle',
		'heroText',
		'heroPrimaryButton',
		'heroSecondaryButton',
		'heroAlign',
	];

	const canUpdate = scopeData.activePermissions.canManage;
	return {
		create: true,
		update: canUpdate ? editProps : false,
	};
};
