import passport from 'passport';
import crypto from 'crypto';
import { promisify } from 'util';

import { assert } from 'utils/assert';
import * as types from 'types';
import { User } from 'server/models';
import { isDuqDuq, isProd } from 'utils/environment';
import { contract } from 'utils/api/contract';
import { AppRouteImplementation } from '@ts-rest/express';
import { getHashedUserId } from 'utils/caching/getHashedUserId';

type SetPasswordData = { hash: string; salt: string };
type Step1Result = [types.UserWithPrivateFields, null] | [null, types.UserWithPrivateFields];
type Step2Result = [types.UserWithPrivateFields, null] | [null, SetPasswordData];
type Step3Result = [types.UserWithPrivateFields, null] | [null, types.UserWithPrivateFields[][]];

export const loginRouteImplementation: AppRouteImplementation<typeof contract.auth.login> = async ({
	req,
	res,
}) => {
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
			/* If authentication succeeded, we have a user */
			if (user) {
				return [user, null] as Step1Result;
			}

			/* If authentication did not succeed, we need to check if a legacy hash is valid */
			const findUser = User.findOne({
				where: { email: req.body.email },
			});

			return Promise.all([null, findUser]) as Promise<Step1Result>;
		})
		.then(([user, userData]) => {
			if (user) {
				return [user, null] as Step2Result;
			}

			/* If the login failed, and there is no
			userData, then the email doesn't exist */
			if (!userData) {
				throw new Error('Invalid email');
			}
			/* If the login failed, but the email exists, and the
			digest is already sha512, it's simply a wrong password */
			if (userData.passwordDigest === 'sha512') {
				throw new Error('Invalid password');
			}

			/* If the login failed, but the email exists, and the digest
			is not sha512, we need to check for valid legacy hashes */
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

			/* If isLegacyValid, we need to update user to sha512 */
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
			const logIn = promisify(req.logIn.bind(req));
			await logIn(user);
			const hashedUserId = getHashedUserId(user);

			res.cookie('pp-lic', `pp-li-${hashedUserId}`, {
				...(isProd() &&
					req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
				...(isDuqDuq() &&
					req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days to match login cookies
			});
			return {
				status: 201,
				body: 'success',
			} as const;
		})
		.catch((err) => {
			const unaunthenticatedValues = ['Invalid password', 'Invalid email'];
			if (unaunthenticatedValues.includes(err.message)) {
				return { status: 401, body: 'Login attempt failed' } as const;
			}
			return { status: 500, body: err.message } as const;
		});
};
