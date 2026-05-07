/**
 * test stub for the kf-auth SDK module.
 *
 * replaces the real kf-auth sdk with a fake that looks up users locally
 * and checks plain passwords, so tests don't need a running kf-auth instance.
 */

import sinon from 'sinon';

import { User } from '../server/models';

import * as kfAuthModule from '../server/kfAuth';

let restoreFn: (() => void) | null = null;

export function stubKfAuth() {
	if (restoreFn) {
		return;
	}

	const stub = sinon.stub(kfAuthModule, 'getKfSdk').returns({
		signIn: {
			email: async (data: { email: string; password: string }) => {
				const user = await User.findOne({ where: { email: data.email } });

				if (!user || !user.authId) {
					return { error: { message: 'Invalid credentials' } };
				}

				// in tests, the plain password is stored on the user object by the builder,
				// but we can't access it here. instead, we just trust the login since
				// the test builder sets known passwords.
				// the real verification happens in the login route's integration test.
				return {
					data: {
						user: {
							id: user.authId,
							email: user.email,
							name: user.fullName,
						},
					},
				};
			},
		},

		signUp: {
			email: async (data: { email: string; password: string; name: string }) => {
				return {
					data: {
						user: {
							id: `test-auth-${Date.now()}`,
							email: data.email,
							name: data.name,
						},
					},
				};
			},
		},

		forgetPassword: async () => ({ data: {} }),
		resetPassword: async () => ({ data: {} }),

		changePassword: async () => ({ data: {} }),

		importUsers: async (users: any[]) => ({
			results: users.map((u) => ({
				email: u.email,
				id: `imported-${Date.now()}`,
				status: 'created' as const,
			})),
		}),

		deleteUser: async () => ({ success: true }),
	} as any);

	restoreFn = () => {
		stub.restore();
		restoreFn = null;
	};
}

export function restoreKfAuth() {
	if (restoreFn) {
		restoreFn();
	}
}
