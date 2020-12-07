import { Signup } from 'server/models';
import { checkIfSuperAdmin } from 'server/utils/queryHelpers/scopeGet';

export const getPermissions = async ({ userId, submittedUserId, email, hash }) => {
	const isSuperAdmin = checkIfSuperAdmin(userId);
	const signUpData = await Signup.findOne({
		where: { hash: hash, email: email },
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
