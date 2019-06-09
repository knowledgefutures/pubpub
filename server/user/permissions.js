import { Signup } from '../models';
import { checkIfSuperAdmin } from '../utils';

export const getPermissions = ({ userId, submittedUserId, email, hash }) => {
	const isSuperAdmin = checkIfSuperAdmin(userId);
	return Signup.findOne({
		where: { hash: hash, email: email },
		attributes: ['email', 'hash', 'completed'],
	}).then((signUpData) => {
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
		];

		const isAuthenticated = submittedUserId === userId || isSuperAdmin;
		return {
			create: signUpData,
			update: isAuthenticated && editProps,
		};
	});
};
