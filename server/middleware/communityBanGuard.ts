import type { NextFunction, Request, Response } from 'express';

import { isUserBannedInCommunityByHostname } from 'server/communityBan/queries';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

const EXEMPT_PATHS = new Set([
	'/api/login',
	'/api/logout',
	'/api/password-reset',
	'/api/signup',
	'/api/health',
	'/api/pubs/many',
	'/api/activityItems',
	'/api/analytics/track',
	'/api/subscribe',
]);

const isExempt = (path: string) => {
	if (EXEMPT_PATHS.has(path)) return true;
	// community moderation endpoints must remain accessible so admins can retract flags
	if (path.startsWith('/api/communityBans')) return true;
	// superadmin spam management must not be blocked
	if (path.startsWith('/api/spamTags')) return true;

	return false;
};

/**
 * this prevents users which are banned from a community from performing actions on that community
 * somewhat costly, because we need to query the database for each mutating request, but it's alright
 */
export const communityBanGuard = () => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (
			!MUTATING_METHODS.has(req.method) ||
			!req.path.startsWith('/api') ||
			isExempt(req.path)
		) {
			return next();
		}

		const userId = req.user?.id;
		if (!userId) {
			return next();
		}

		const banned = await isUserBannedInCommunityByHostname(userId, req.hostname);

		if (!banned) {
			return next();
		}

		return res.status(403).json({
			error: 'communityBanned',
			message:
				'You have been banned by the administrators of this community and cannot perform this action.',
		});
	};
};
