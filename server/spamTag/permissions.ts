import { isUserSuperAdmin } from 'server/user/queries';

type CanManipulateSpamTagOptions = {
	userId: string;
};

export const canManipulateSpamTags = (options: CanManipulateSpamTagOptions) => {
	const { userId } = options;
	return isUserSuperAdmin({ userId });
};
