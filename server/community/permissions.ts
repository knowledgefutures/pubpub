import { getFeatureFlagsForUserAndCommunity } from 'server/featureFlag/queries';
import { getScope } from 'server/utils/queryHelpers';
import { isDataExportEnabled } from 'utils/analytics/featureFlags';

export const getPermissions = async ({
	userId,
	communityId,
}: {
	userId?: string | null;
	communityId?: string | null;
}) => {
	if (!userId) {
		return {};
	}

	if (!communityId) {
		return {
			create: true,
		};
	}
	const [scopeData, featureFlags] = await Promise.all([
		getScope({
			communityId,
			loginId: userId,
		}),
		getFeatureFlagsForUserAndCommunity(userId, communityId),
	]);

	const exportEnabled = isDataExportEnabled(featureFlags);

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
		'instagram',
		'mastodon',
		'linkedin',
		'bluesky',
		'github',
		'socialLinksLocation',
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
	] as const;

	const canUpdate = scopeData.activePermissions.canManage;
	const canAdmin = scopeData.activePermissions.canAdmin;
	const canArchive =
		(scopeData.activePermissions.canAdminCommunity && exportEnabled) ||
		scopeData.activePermissions.isSuperAdmin;

	// only admins can edit analytics settings
	const editPropsWithAnalytics = canAdmin
		? ([...editProps, 'analyticsSettings'] as const)
		: editProps;

	return {
		create: true,
		update: canUpdate ? editPropsWithAnalytics : false,
		admin: canAdmin,
		archive: canArchive,
	};
};
