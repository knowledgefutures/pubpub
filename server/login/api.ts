import type { AppRouteImplementation } from '@ts-rest/express';

import type * as types from 'types';
import type { UserSpamTagFields } from 'types';
import type { contract } from 'utils/api/contract';

import crypto from 'crypto';
import passport from 'passport';
import { promisify } from 'util';

import { provisionLocalUser } from 'server/kf/provisionLocalUser';
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
	| { status: 410; body: string }
	| { status: 500; body: string };

const DEPRECATION_SUNSET = 'Wed, 30 Jun 2026 23:59:59 GMT';
const DEPRECATION_LINK = '<https://pubpub.org/docs/api-tokens>; rel="deprecation"';

function applyDeprecationHeaders(res: any): void {
	res.set('Deprecation', 'true');
	res.set('Sunset', DEPRECATION_SUNSET);
	res.set('Link', DEPRECATION_LINK);
}

/**
 * Issue PubPub's session + cache cookie for a freshly-authenticated user.
 * Shared between the legacy local verification path (test env) and the new
 * kf-auth handshake path.
 */
async function establishPubPubSession(req: any, res: any, user: types.UserWithPrivateFields | any) {
	const spamTag = await getSpamTagForUser(user.id);
	if (spamTag?.status === 'confirmed-spam') {
		const fields = spamTag.fields as UserSpamTagFields | null;
		const wasAutomated = !fields?.manuallyMarkedBy?.length;
		throw new Error(wasAutomated ? 'ACCOUNT_RESTRICTED_AUTOMATED' : 'ACCOUNT_RESTRICTED');
	}

	const logIn = promisify(req.logIn.bind(req));
	await logIn(user);
	const hashedUserId = getHashedUserId(user);

	res.cookie('pp-lic', `pp-li-${hashedUserId}`, {
		...(isProd() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
		...(isDuqDuq() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
		maxAge: 30 * 24 * 60 * 60 * 1000,
	});
}

function mapEstablishError(err: Error): LoginResult | null {
	if (err.message === 'ACCOUNT_RESTRICTED' || err.message === 'ACCOUNT_RESTRICTED_AUTOMATED') {
		const isAutomated = err.message === 'ACCOUNT_RESTRICTED_AUTOMATED';
		const automatedNote = isAutomated
			? ' This action was taken by our automated spam detection systems.'
			: '';
		return {
			status: 403,
			body: `Your account has been restricted due to activity identified as spam.${automatedNote} If you believe this is an error, please contact help@pubpub.org.`,
		} as const;
	}
	return null;
}

/**
 * Verify the SDK's sha3-prehashed password against kf-auth's source-of-truth
 * via the Bearer-authenticated internal route. We don't use Better Auth's
 * public `/api/auth/sign-in/email` because (a) it enforces an Origin check
 * (`MISSING_OR_NULL_ORIGIN`) intended for browsers, and (b) it would mint a
 * kf-auth session we'd only have to clean up. The internal route just
 * verifies and returns the userId; PubPub then provisions the local User row
 * if missing and establishes its own passport session as it always has.
 */
async function performKfAuthLogin(req: any, res: any): Promise<LoginResult> {
	const apiUrl =
		process.env.AUTH_INTERNAL_API_URL ??
		process.env.OIDC_ISSUER_INTERNAL_URL ??
		process.env.OIDC_ISSUER_URL ??
		'';
	const apiKey = process.env.AUTH_INTERNAL_API_KEY ?? '';
	if (!apiUrl || !apiKey) {
		console.error('Legacy /api/login: AUTH_INTERNAL_API_URL/KEY not configured');
		return { status: 500, body: 'Authentication service not configured' } as const;
	}

	let verifyRes: Response;
	try {
		verifyRes = await fetch(`${apiUrl}/api/internal/legacy-pubpub-login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				email: req.body.email,
				prehashedPassword: req.body.password,
			}),
		});
	} catch (err: any) {
		console.error('Legacy /api/login: kf-auth unreachable', err?.message ?? err);
		return { status: 500, body: 'Authentication service unavailable' } as const;
	}

	if (verifyRes.status === 410) {
		// kf-auth says the user's stored hash is no longer in legacy pubpub:
		// format (e.g. they reset their password and now have bcrypt).
		// Route the SDK client to the API token UI.
		return {
			status: 410,
			body: 'This login path is deprecated for your account. Generate an API token at /dashboard/settings/tokens to authenticate the SDK.',
		} as const;
	}

	if (!verifyRes.ok) {
		console.error('Legacy /api/login: kf-auth verify failed', verifyRes.status);
		return { status: 500, body: 'Authentication service error' } as const;
	}

	let payload: { verified?: boolean; userId?: string } = {};
	try {
		payload = (await verifyRes.json()) as typeof payload;
	} catch {
		return { status: 500, body: 'Invalid response from authentication service' } as const;
	}
	if (!payload.verified || !payload.userId) {
		return { status: 401, body: 'Login attempt failed' } as const;
	}

	const user = await provisionLocalUser(payload.userId, { email: req.body.email });

	try {
		await establishPubPubSession(req, res, user);
	} catch (err: any) {
		const mapped = mapEstablishError(err);
		if (mapped) return mapped;
		throw err;
	}
	return { status: 201, body: 'success' } as const;
}

/**
 * Pre-kf-auth verification flow, retained verbatim so the test harness (which
 * seeds users only into PubPub's DB via passport-local-sequelize) keeps
 * passing. Production environments always set `OIDC_ISSUER_URL`, so this
 * branch is only reachable in tests.
 */
function performLegacyLocalLogin(req: any, res: any): Promise<LoginResult> {
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
			await establishPubPubSession(req, res, user);
			return { status: 201, body: 'success' } as const;
		})
		.catch((err) => {
			const mapped = mapEstablishError(err);
			if (mapped) return mapped;
			const unaunthenticatedValues = ['Invalid password', 'Invalid email'];
			if (unaunthenticatedValues.includes(err.message)) {
				return { status: 401, body: 'Login attempt failed' } as const;
			}
			return { status: 500, body: err.message } as const;
		});
}

const performLogin = async (req: any, res: any): Promise<LoginResult> => {
	applyDeprecationHeaders(res);
	// Production sets both — the key is the discriminator since AUTH_INTERNAL_API_URL
	// falls back to OIDC_* defaults. Tests omit the key and take the legacy path.
	if (process.env.AUTH_INTERNAL_API_KEY) {
		return performKfAuthLogin(req, res);
	}
	return performLegacyLocalLogin(req, res);
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
