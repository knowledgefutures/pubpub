import type { AppRouteImplementation } from '@ts-rest/express';

import type * as types from 'types';
import type { contract } from 'utils/api/contract';

import crypto from 'crypto';
import passport from 'passport';
import { promisify } from 'util';

import { User } from 'server/models';
import { getSpamTagForUser } from 'server/spamTag/userQueries';
import { verifyCaptchaPayload } from 'server/utils/captcha';
import { assert } from 'utils/assert';
import { getHashedUserId } from 'utils/caching/getHashedUserId';
import { isDuqDuq, isProd } from 'utils/environment';

type SetPasswordData = { hash: string; salt: string };
type Step1Result = [types.UserWithPrivateFields, null] | [null, types.UserWithPrivateFields];
type Step2Result = [types.UserWithPrivateFields, null] | [null, SetPasswordData];
type Step3Result = [types.UserWithPrivateFields, null] | [null, types.UserWithPrivateFields[][]];

type LoginResult =
	| { status: 201; body: 'success' }
	| { status: 401; body: 'Login attempt failed' }
	| { status: 403; body: string }
	| { status: 500; body: string };

const performLogin = (req: any, res: any): Promise<LoginResult> => {
	const authenticate = new Promise<types.UserWithPrivateFields | null>((resolve, reject) => {
		passport.authenticate('local', (authErr: Error, user: types.UserWithPrivateFields) => {
			if (authErr) {
				return reject(authErr);
			}
			return resolve(user);
		})(req, res);
	});
	return authenticate
		.then((user) => {
			if (user) {
				return [user, null] as Step1Result;
			}
			const findUser = User.findOne({
				where: { email: req.body.email },
			});
			return Promise.all([null, findUser]) as Promise<Step1Result>;
		})
		.then(([user, userData]) => {
			if (user) {
				return [user, null] as Step2Result;
			}
			if (!userData) {
				throw new Error('Invalid email');
			}
			if (userData.passwordDigest === 'sha512') {
				throw new Error('Invalid password');
			}
			const pubpubSha1HashRaw = crypto.pbkdf2Sync(
				req.body.password,
				userData.salt,
				25000,
				512,
				'sha1',
			);
			// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
			const pubpubSha1Hash = Buffer.from(pubpubSha1HashRaw, 'binary').toString('hex');
			const isPubPubSha1Valid = pubpubSha1Hash === userData.hash;

			const frankenbookHashRaw = crypto.pbkdf2Sync(
				req.body.password,
				userData.salt,
				12000,
				512,
				'sha1',
			);
			// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
			const frankenbookHash = Buffer.from(frankenbookHashRaw, 'binary').toString('hex');
			const isfrankenbookValid = frankenbookHash === userData.hash;

			const isLegacyValid = isPubPubSha1Valid || isfrankenbookValid;
			if (!isLegacyValid) {
				throw new Error('Invalid password');
			}
			const setPassword = promisify((userData as any).setPassword.bind(userData));
			return Promise.all([null, setPassword(req.body.password)]) as Promise<Step2Result>;
		})
		.then(([user, setPasswordData]) => {
			if (user) {
				return [user, null] as Step3Result;
			}
			assert(setPasswordData !== null);
			const userUpdateData = {
				passwordDigest: 'sha512',
				hash: setPasswordData.hash,
				salt: setPasswordData.salt,
			};
			const updateUser = User.update(userUpdateData, {
				where: { email: req.body.email },
				returning: true,
			});
			return Promise.all([null, updateUser]) as Promise<Step3Result>;
		})
		.then(([user, updatedUserData]) => {
			if (user) {
				return user;
			}
			assert(updatedUserData !== null);
			return updatedUserData[1][0];
		})
		.then(async (user) => {
			const spamTag = await getSpamTagForUser(user.id);
			if (spamTag?.status === 'confirmed-spam') {
				throw new Error('ACCOUNT_RESTRICTED');
			}
			const logIn = promisify(req.logIn.bind(req));
			await logIn(user);
			const hashedUserId = getHashedUserId(user);

			res.cookie('pp-lic', `pp-li-${hashedUserId}`, {
				...(isProd() &&
					req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
				...(isDuqDuq() &&
					req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
				maxAge: 30 * 24 * 60 * 60 * 1000,
			});
			return { status: 201, body: 'success' } as const;
		})
		.catch((err) => {
			if (err.message === 'ACCOUNT_RESTRICTED') {
				return {
					status: 403,
					body: 'Your account has been restricted. If you believe this is an error, please contact hello@pubpub.org.',
				} as const;
			}
			const unaunthenticatedValues = ['Invalid password', 'Invalid email'];
			if (unaunthenticatedValues.includes(err.message)) {
				return { status: 401, body: 'Login attempt failed' } as const;
			}
			return { status: 500, body: err.message } as const;
		});
};

export const loginRouteImplementation: AppRouteImplementation<typeof contract.auth.login> = async ({
	req,
	res,
}) => performLogin(req, res);

export const loginFromFormRouteImplementation: AppRouteImplementation<
	typeof contract.auth.loginFromForm
> = async ({ req, res }) => {
	const ok = await verifyCaptchaPayload(req.body.altcha);
	if (!ok) {
		return { status: 400, body: 'Please complete the verification and try again.' } as const;
	}
	return performLogin(req, res);
};
