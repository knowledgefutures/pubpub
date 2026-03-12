import { Router } from 'express';
import passport from 'passport';
import { z } from 'zod';

import { verifyCaptchaPayload } from 'server/utils/captcha';
import { BadRequestError, NotFoundError } from 'server/utils/errors';
import { handleHoneypotTriggered, isHoneypotFilled } from 'server/utils/honeypot';
import { wrap } from 'server/wrap';
import { getHashedUserId } from 'utils/caching/getHashedUserId';
import { isDuqDuq, isProd } from 'utils/environment';

import { getPermissions } from './permissions';
import { createUser, getSuggestedEditsUserInfo, updateUser } from './queries';

export const router = Router();

const ACCOUNT_RESTRICTED_MESSAGE =
	'Your account has been restricted. If you believe this is an error, please contact hello@pubpub.org.';
const FAST_HONEYPOT_WINDOW_MS = 5_000;

const getFastHoneypotSignal = ({
	honeypot,
	formStartedAtMs,
	nowMs = Date.now(),
}: {
	honeypot: unknown;
	formStartedAtMs: unknown;
	nowMs?: number;
}): string | null => {
	const honeypotValue = typeof honeypot === 'string' ? honeypot.trim() : '';

	if (honeypotValue.length === 0) return null;

	const parsedFormStartedAtMs = Number(formStartedAtMs);

	if (!Number.isFinite(parsedFormStartedAtMs)) return null;

	const elapsedMs = nowMs - parsedFormStartedAtMs;
	if (elapsedMs < 0 || elapsedMs > FAST_HONEYPOT_WINDOW_MS) return null;

	return honeypotValue;
};

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		submittedUserId: req.body.userId,
		email: req.body.email ? req.body.email.toLowerCase().trim() : null,
		hash: req.body.hash || null,
	};
};

router.post('/api/users', async (req, res) => {
	const requestIds = getRequestIds(req);
	try {
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new Error('Not Authorized');
		}
		const ok = await verifyCaptchaPayload(req.body.altcha);
		if (!ok) {
			return res.status(400).json('Please complete the verification and try again.');
		}
		const { altcha, _honeypot, _passwordHoneypot, _formStartedAtMs, ...body } = { ...req.body };
		const fastHoneypotSignal = getFastHoneypotSignal({
			honeypot: _passwordHoneypot,
			formStartedAtMs: _formStartedAtMs,
		});

		const newUser = await createUser(body);
		if (fastHoneypotSignal || _honeypot) {
			await handleHoneypotTriggered(
				newUser.id,
				'create-user',
				_honeypot || 'confirmPassword + very fast',
				{
					communitySubdomain: req.headers.host?.split('.')[0],
					content: req.body.fullName ? `name: ${req.body.fullName}` : undefined,
				},
			);
			return res.status(403).json(ACCOUNT_RESTRICTED_MESSAGE);
		}
		passport.authenticate('local')(req, res, () => {
			const hashedUserId = getHashedUserId(newUser);
			res.cookie('pp-lic', `pp-li-${hashedUserId}`, {
				...(isProd() &&
					req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
				...(isDuqDuq() &&
					req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days to match login cookies
			});
			return res.status(201).json(newUser);
		});
	} catch (err) {
		console.error('Error in postUser: ', err);
		return res.status(500).json(err instanceof Error ? err.message : 'Error');
	}
});

const uuidParser = z.string().uuid();

router.get(
	'/api/users/:id',
	wrap(async (req, res) => {
		const { id } = req.params;
		if (!id || !uuidParser.safeParse(id).success) {
			throw new BadRequestError();
		}

		const userInfo = await getSuggestedEditsUserInfo(id);
		if (!userInfo) {
			throw new NotFoundError();
		}

		return res.status(201).json(userInfo);
	}),
);

router.put('/api/users', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateUser(req.body, permissions.update, req);
		})
		.then((updatedValues) => res.status(201).json(updatedValues))
		.catch((err) => {
			console.error('Error in putUser: ', err);
			return res.status(500).json(err instanceof Error ? err.message : 'Error');
		});
});

router.put('/api/users/fromForm', async (req, res) => {
	try {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.update) {
			throw new Error('Not Authorized');
		}
		if (isHoneypotFilled(req.body)) {
			if (req.user?.id)
				await handleHoneypotTriggered(req.user.id, 'edit-user', req.body._honeypot, {
					content: req.body.fullName ? `name: ${req.body.fullName}` : undefined,
				});
		}
		const body = { ...req.body };
		delete body._honeypot;
		const updatedValues = await updateUser(body, permissions.update, req);
		return res.status(201).json(updatedValues);
	} catch (err) {
		console.error('Error in putUser fromForm: ', err);
		return res.status(500).json(err instanceof Error ? err.message : 'Error');
	}
});
