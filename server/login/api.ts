import type { AppRouteImplementation } from '@ts-rest/express';

import type { UserSpamTagFields } from 'types';
import type { contract } from 'utils/api/contract';

import { User } from 'server/models';
import { getKfSdk } from 'server/kfAuth';
import { getSpamTagForUser } from 'server/spamTag/userQueries';
import { verifyCaptchaPayload } from 'server/utils/captcha';
import { getHashedUserId } from 'utils/caching/getHashedUserId';
import { isDuqDuq, isProd } from 'utils/environment';

type LoginResult =
	| { status: 201; body: 'success' }
	| { status: 401; body: 'Login attempt failed' }
	| { status: 403; body: string }
	| { status: 500; body: string };

const performLogin = async (req: any, res: any): Promise<LoginResult> => {
	try {
		const kf = getKfSdk();

		const result = await kf.signIn.email({
			email: req.body.email,
			password: req.body.password,
		});

		if (result.error || !result.data) {
			return { status: 401, body: 'Login attempt failed' };
		}

		const user = await User.findOne({ where: { authId: result.data.user.id } });

		if (!user) {
			return { status: 401, body: 'Login attempt failed' };
		}

		const spamTag = await getSpamTagForUser(user.id);

		if (spamTag?.status === 'confirmed-spam') {
			const fields = spamTag.fields as UserSpamTagFields | null;
			const wasAutomated = !fields?.manuallyMarkedBy?.length;
			const automatedNote = wasAutomated
				? ' This action was taken by our automated spam detection systems.'
				: '';

			return {
				status: 403,
				body: `Your account has been restricted due to activity identified as spam.${automatedNote} If you believe this is an error, please contact help@pubpub.org.`,
			};
		}

		req.session.userId = user.id;

		const hashedUserId = getHashedUserId(user);
		res.cookie('pp-lic', `pp-li-${hashedUserId}`, {
			...(isProd() &&
				req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
			...(isDuqDuq() &&
				req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		return { status: 201, body: 'success' };
	} catch (err: any) {
		console.error('Error in performLogin:', err);
		return { status: 500, body: err.message };
	}
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
