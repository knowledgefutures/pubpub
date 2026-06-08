import type { NextFunction, Request, Response } from 'express';

const SKIP_PREFIXES = ['/api', '/auth', '/dist', '/static', '/service-worker', '/favicon'];

/**
 * Detects "was logged in, session expired" and triggers silent re-auth
 * via OIDC prompt=none. Only fires for browser page loads (GET requests
 * to non-API, non-asset paths).
 *
 * Uses the `pp-lic` CDN cookie (set at login, 30-day maxAge) to detect
 * that the user was previously authenticated. A `pp-renew-failed` cookie
 * acts as a circuit breaker to prevent redirect loops when kf-auth's
 * session is also expired.
 */
export const silentReauthMiddleware = () => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (req.method !== 'GET') return next();
		if (SKIP_PREFIXES.some((p) => req.path.startsWith(p))) {
			return next();
		}

		if (req.user) return next();

		// After logout it's set to 'pp-lo' - renewing would resurrect the session the user just deliberately ended.
		const lic = req.cookies?.['pp-lic'];
		if (typeof lic !== 'string' || !lic.startsWith('pp-li-')) return next();

		// Circuit breaker: recently tried and failed - skip
		if (req.cookies?.['pp-renew-failed']) return next();

		const returnTo = req.originalUrl;
		return res.redirect(`/auth/login?renew=true&return_to=${encodeURIComponent(returnTo)}`);
	};
};
