import type { RequestHandler } from 'express';

import type { UserWithPrivateFields } from 'types';

import { ForbiddenError } from 'server/utils/errors';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';

import { AuthToken, includeUserModel } from '../models';

export const authTokenMiddleware: RequestHandler = async (req, _res, next) => {
	if (!req.path.includes('/api')) {
		return next();
	}

	if (req.user != null) {
		return next();
	}

	const authHeader = req.headers.authorization;
	const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

	if (!token) {
		return next();
	}

	try {
		const authToken = await AuthToken.findOne({
			where: { token },
			include: [includeUserModel({ as: 'user' })],
		});

		if (!authToken) {
			return next();
		}

		const { expiresAt, user } = authToken;

		if (expiresAt !== null && expiresAt < new Date()) {
			return next(new ForbiddenError(new Error('Token expired')));
		}

		await ensureUserIsCommunityAdmin({
			hostname: req.hostname,
			user: user as UserWithPrivateFields,
		});

		req.user = user;
		return next();
	} catch (err) {
		return next(err);
	}
};
