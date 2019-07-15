import { CommunityAdmin } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ userId, communityId }) => {
	if (!userId) {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	const isSuperAdmin = checkIfSuperAdmin(userId);
	return CommunityAdmin.findOne({ where: { communityId: communityId, userId: userId } }).then(
		(communityAdminData) => {
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

			const canUpdate = isSuperAdmin || communityAdminData;
			return {
				create: true,
				update: canUpdate ? editProps : false,
			};
		},
	);
};
