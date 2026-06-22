import type { NextFunction, Request, Response } from 'express';

import { checkKfSession } from '../kf/sessionCheck';

/**
 * Keeps the local session in sync with kf-auth's authority over it.
 *
 * For a logged-in OIDC session that's due, this introspects its refresh token
 * against kf-auth (see sessionCheck.ts). If the kf-auth session was revoked or
 * the user banned, the token reads as inactive and the local session is torn
 * down (which also flips the `pp-lic` CDN marker to logged-out).
 *
 * This replaced the old browser-driven `prompt=none` silent re-auth, which
 * could not work across registrable domains (kf-auth's SameSite=Lax session
 * cookie is never sent on the cross-site iframe/redirect the renewal needed,
 * and third-party-cookie protection blocks it regardless).
 */
export const kfSessionCheckMiddleware = () => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) return next();

		try {
			await checkKfSession(req, res);
		} catch {
			// Never block a request on a revalidation hiccup — retry next time.
		}

		next();
	};
};
