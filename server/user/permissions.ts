import { Signup } from 'server/models';

import { isUserSuperAdmin } from './queries';

export const updatePermissions = [
	'slug',
	'firstName',
	'lastName',
	'avatar',
	'title',
	'bio',
	'location',
	'website',
	'orcid',
	'github',
	'twitter',
	'facebook',
	'linkedin',
	'instagram',
	'mastodon',
	'bluesky',
	'googleScholar',
	'gdprConsent',
] as const;

export const getPermissions = async ({
	userId,
	submittedUserId,
	email,
	hash,
}: {
	userId: string | undefined | null;
	submittedUserId: string | undefined | null;
	email: string;
	hash: string | null;
}): Promise<UserPermissions> => {
	const isSuperAdmin = await isUserSuperAdmin({ userId });
	const signUpData = await Signup.findOne({
		where: { hash, email },
		attributes: ['email', 'hash', 'completed'],
	});

	if (hash && !signUpData) {
		throw new Error('Hash not valid');
	}
	if (hash && signUpData?.completed) {
		throw new Error('Account already created');
	}

	const isAuthenticated = submittedUserId === userId || isSuperAdmin;

	return {
		create: signUpData,
		update: isAuthenticated && updatePermissions,
		read: isAuthenticated,
	};
};

export type UserPermissions = {
	create: Signup | null;
	update: false | typeof updatePermissions;
	read: boolean;
};
