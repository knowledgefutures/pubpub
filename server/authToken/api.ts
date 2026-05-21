import { initServer } from '@ts-rest/express';

import { Community, User } from 'server/models';
import { BadRequestError, ForbiddenError, NotFoundError } from 'server/utils/errors';
import { contract } from 'utils/api/contract';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';

import { AuthToken } from './model';
import { generateAuthToken, hashAuthToken } from './tokenGenerator';

const s = initServer();

const PUBLIC_ATTRIBUTES = ['id', 'userId', 'communityId', 'lastFour', 'expiresAt', 'createdAt'];

export const authTokenServer = s.router(contract.authToken, {
	create: async ({ body, req }) => {
		const community = await ensureUserIsCommunityAdmin({
			user: req.user,
			id: body.communityId,
		});

		const expiresAt = (() => {
			switch (body.expiresAt) {
				case 'never':
					return null;
				case '1d':
					return new Date(Date.now() + 1000 * 60 * 60 * 24);
				case '1w':
					return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
				case '1m':
					return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
				case '3m':
					return new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
				case '1y':
					return new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
				default:
					return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
			}
		})();

		const { raw, hashedToken, lastFour } = generateAuthToken();

		const authToken = await AuthToken.create({
			userId: req.user.id,
			communityId: community.id,
			hashedToken,
			lastFour,
			expiresAt,
		});

		// The raw token is shown to the user exactly once; we never persist it.
		return {
			status: 201,
			body: {
				id: authToken.id,
				userId: authToken.userId,
				communityId: authToken.communityId,
				lastFour: authToken.lastFour,
				expiresAt: authToken.expiresAt ? authToken.expiresAt.toISOString() : null,
				token: raw,
			},
		};
	},
	getForUser: async ({ req }) => {
		if (!req.user) {
			throw new BadRequestError(new Error('User not found'));
		}

		const tokens = await AuthToken.findAll({
			where: { userId: req.user.id },
			attributes: PUBLIC_ATTRIBUTES,
			include: [
				{
					model: Community,
					as: 'community',
					attributes: ['id', 'title', 'subdomain'],
				},
			],
			order: [['createdAt', 'DESC']],
		});

		return {
			status: 200,
			body: tokens.map((t) => t.toJSON()) as any,
		};
	},

	getForCommunity: async ({ params, req }) => {
		await ensureUserIsCommunityAdmin({
			user: req.user,
			id: params.communityId,
		});

		const tokens = await AuthToken.findAll({
			where: { communityId: params.communityId },
			attributes: PUBLIC_ATTRIBUTES,
			include: [
				{
					model: User,
					as: 'user',
					attributes: ['id', 'fullName', 'slug', 'avatar', 'initials'],
				},
			],
			order: [['createdAt', 'DESC']],
		});

		return {
			status: 200,
			body: tokens.map((t) => t.toJSON()) as any,
		};
	},

	remove: async ({ params, req }) => {
		if (!req.user) {
			throw new BadRequestError(new Error('User not found'));
		}

		const { id: tokenId } = params;

		const authToken = await AuthToken.findOne({
			where: { id: tokenId, userId: req.user.id },
		});

		if (!authToken) {
			throw new NotFoundError(new Error('Token not found'));
		}

		await authToken.destroy();

		return {
			status: 200,
			body: tokenId,
		};
	},

	removeForCommunity: async ({ params, req }) => {
		await ensureUserIsCommunityAdmin({
			user: req.user,
			id: params.communityId,
		});

		const authToken = await AuthToken.findOne({
			where: { id: params.id, communityId: params.communityId },
		});

		if (!authToken) {
			throw new NotFoundError(new Error('Token not found'));
		}

		await authToken.destroy();

		return {
			status: 200,
			body: params.id,
		};
	},

	removeByToken: async ({ body: { token }, req: { user } }) => {
		if (!user?.isSuperAdmin) {
			throw new ForbiddenError(new Error('User is not a superadmin'));
		}

		const destroyed = await AuthToken.destroy({
			where: { hashedToken: hashAuthToken(token) },
		});

		if (destroyed === 0) {
			throw new NotFoundError(new Error('Token not found'));
		}

		return {
			status: 200,
			body: token,
		};
	},
});
