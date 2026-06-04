import type { NextFunction, Request, Response } from 'express';

import { SpamTag } from 'server/models';

const banCache = new Map<string, { banned: boolean; checkedAt: number }>();
const CACHE_TTL_MS = 60_000;

export const platformBanGuard = () => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.path.startsWith('/api')) return next();

		const user = req.user as any;
		if (!user?.id || !user.spamTagId) return next();

		const now = Date.now();
		const cached = banCache.get(user.id);
		if (cached && now - cached.checkedAt < CACHE_TTL_MS) {
			if (!cached.banned) return next();
			return res
				.status(403)
				.json({ error: 'accountSuspended', message: 'Your account has been suspended.' });
		}

		const spamTag = await SpamTag.findByPk(user.spamTagId, { attributes: ['status'] });
		const banned = spamTag?.status === 'confirmed-spam';
		banCache.set(user.id, { banned, checkedAt: now });

		if (!banned) return next();

		req.logout();
		return res.status(403).json({
			error: 'accountSuspended',
			message: 'Your account has been suspended.',
		});
	};
};
