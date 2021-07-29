import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, communityId }) => {
	if (!userId) {
		return {};
	}

	if (!communityId) {
		return {
			create: true,
		};
	}
	const scopeData = await getScope({
		communityId,
		loginId: userId,
	});
	const editProps = [
		'title',
		'citeAs',
		'publishAs',
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
		'navLinks',
		'footerLinks',
		'footerTitle',
		'footerLogoLink',
		'footerImage',
	];

	const canUpdate = scopeData.activePermissions.canManage;
	return {
		create: true,
		update: canUpdate ? editProps : false,
	};
};
