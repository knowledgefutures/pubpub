import type express from 'express';

import type { UserWithPrivateFields } from 'types';

import { Strategy as BearerStrategy } from 'passport-http-bearer';

import { ForbiddenError } from 'server/utils/errors';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';

import { AuthToken, includeUserModel } from '../models';
import { hashAuthToken } from './tokenGenerator';

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
				where: { hashedToken: hashAuthToken(token) },
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
				const community = await ensureUserIsCommunityAdmin({
					hostname: req.hostname,
					user: user as UserWithPrivateFields,
				});
				if (community.id !== authToken.communityId) {
					throw new ForbiddenError(new Error('Token is not for this community'));
				}
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
