import type { NextFunction, Request, Response } from 'express';

const PAGE_SKIP_PREFIXES = ['/auth', '/dist', '/static', '/service-worker', '/favicon'];

/**
 * Detects "was logged in, session expired" and triggers silent re-auth.
 *
 * - Page navigations (GET to non-asset paths): 302 redirect to OIDC prompt=none.
 * - API requests (/api/*): 401 JSON with `error: 'sessionExpired'` so the
 *   frontend can renew via a hidden iframe and retry transparently.
 *
 * Uses the `pp-lic` CDN cookie (set at login, 30-day maxAge) to detect
 * that the user was previously authenticated. A `pp-renew-failed` cookie
 * acts as a circuit breaker to prevent redirect loops when kf-auth's
 * session is also expired.
 */
export const silentReauthMiddleware = () => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (req.user) return next();

		// After logout it's set to 'pp-lo' — renewing would resurrect the session the user just deliberately ended.
		const lic = req.cookies?.['pp-lic'];
		if (typeof lic !== 'string' || !lic.startsWith('pp-li-')) return next();

		// Circuit breaker: recently tried and failed — skip
		if (req.cookies?.['pp-renew-failed']) return next();

		// ── API requests: tell the frontend to renew ──
		if (req.path.startsWith('/api')) {
			return res.status(401).json({ error: 'sessionExpired' });
		}

		// ── Page navigations: redirect through OIDC prompt=none ──
		if (req.method !== 'GET') return next();
		if (PAGE_SKIP_PREFIXES.some((p) => req.path.startsWith(p))) return next();

		// This 302 carries no Set-Cookie, so Fastly would otherwise cache it
		// under the per-`pp-lic` cache key (vcl_hash only mixes connect.sid in
		// for /api routes). A cached "go reauth" redirect would then be served
		// even after the user has a valid session again — an infinite loop the
		// session cookie can't bust. Mark it private/no-store so the edge
		// passes it through (Fastly return(pass)es on `Cache-Control ~ private`).
		res.set('Cache-Control', 'private, no-store');
		res.set('Surrogate-Control', 'no-store');

		const returnTo = req.originalUrl;
		return res.redirect(`/auth/login?renew=true&return_to=${encodeURIComponent(returnTo)}`);
	};
};
