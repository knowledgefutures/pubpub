import { Strategy as BearerStrategy } from 'passport-http-bearer';
import type express from 'express';

import { ForbiddenError } from 'server/utils/errors';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';
import type { UserWithPrivateFields } from 'types';

import { includeUserModel, AuthToken } from '../models';

export const bearerStrategy = () => {
	return new BearerStrategy(
		{
			passReqToCallback: true,
		},
		async (
			req: express.Request,
			token: string,
			done: (error: any, user?: any, message?: string) => void,
		) => {
			if (!token) {
				return done(null, false);
			}

			if (req.user) {
				return done(null, req.user);
			}

			const authToken = await AuthToken.findOne({
				where: { token },
				include: [
					includeUserModel({
						as: 'user',
					}),
				],
			});

			if (!authToken) {
				return done(null, false);
			}

			const { expiresAt, user } = authToken;

			try {
				await ensureUserIsCommunityAdmin({
					hostname: req.hostname,
					user: user as UserWithPrivateFields,
				});
			} catch (e) {
				return done(e, false, 'User is not an admin of this community');
			}

			if (expiresAt === null) {
				return done(null, user);
			}

			if (expiresAt < new Date()) {
				return done(new ForbiddenError(new Error('Token expired')), false, 'Token expired');
			}
			req.user = user;

			return done(null, user);
		},
	);
};
