import { isUserSuperAdmin } from 'server/user/queries';

export const canModifyLandingPageFeatures = ({ userId }: { userId: string }) => {
	return isUserSuperAdmin({ userId });
};
