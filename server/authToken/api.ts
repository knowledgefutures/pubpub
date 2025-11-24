import { initServer } from '@ts-rest/express';

import { BadRequestError, ForbiddenError, NotFoundError } from 'server/utils/errors';
import { contract } from 'utils/api/contract';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';

import { AuthToken } from './model';

const s = initServer();

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

		const authToken = await AuthToken.create({
			userId: req.user.id,
			communityId: community.id,
			expiresAt,
		});

		return {
			status: 201,
			body: authToken.toJSON(),
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

	removeByToken: async ({ body: { token }, req: { user } }) => {
		if (!user?.isSuperAdmin) {
			throw new ForbiddenError(new Error('User is not a superadmin'));
		}

		const destroyed = await AuthToken.destroy({
			where: { token },
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
