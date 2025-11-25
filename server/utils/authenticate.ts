import { promisify } from 'util';

import { User } from 'server/models';

export class AuthenticateError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthenticateError';
	}
}

export async function authenticate(email: string, password: string);
export async function authenticate(userData: User, password: string);
export async function authenticate(userDataOrEmail: User | string, password: string) {
	const userData =
		typeof userDataOrEmail === 'string'
			? await User.findOne({ where: { email: userDataOrEmail } })
			: userDataOrEmail;

	if (!userData) {
		throw new AuthenticateError('User not found');
	}

	try {
		const authenticateFn = promisify(userData.authenticate.bind(userData));
		const authResult = await authenticateFn(password);

		if (!authResult) {
			throw new AuthenticateError('Invalid password');
		}
	} catch (_error) {
		throw new AuthenticateError('Invalid password');
	}
}
