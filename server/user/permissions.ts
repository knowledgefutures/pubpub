import { Signup } from 'server/models';
import { isUserSuperAdmin } from './queries';

export const getPermissions = async ({ userId, submittedUserId, email, hash }) => {
	const isSuperAdmin = await isUserSuperAdmin({ userId });
	const signUpData = await Signup.findOne({
		where: { hash, email },
		attributes: ['email', 'hash', 'completed'],
	});

	if (hash && !signUpData) {
		throw new Error('Hash not valid');
	}
	if (hash && signUpData.completed) {
		throw new Error('Account already created');
	}

	const editProps = [
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
		'googleScholar',
		'gdprConsent',
	];

	const isAuthenticated = submittedUserId === userId || isSuperAdmin;

	return {
		create: signUpData,
		update: isAuthenticated && editProps,
	};
};
