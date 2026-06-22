/**
 * Server-side session liveness checks against kf-auth via RFC 7662 token
 * introspection.
 *
 * PubPub is a confidential (server-side) OIDC client. It never calls kf-auth
 * APIs with the user's token after login — it only needs to know "is this
 * kf-auth session still alive?". So instead of redeeming the refresh token (the
 * refresh_token grant rotates it, which is stateful and races across instances),
 * it INTROSPECTS the refresh token: a read-only, idempotent check that is safe
 * to call concurrently from any number of instances. The refresh token is
 * therefore written once at login and never changes, so it lives happily on the
 * express session blob — no side table, no row lock, no transaction.
 *
 * kf-auth reports the token inactive once it's revoked (the session.delete hook
 * revokes the OAuth refresh tokens when a kf-auth session is revoked / the user
 * is banned) or expired, at which point we tear the local session down. The
 * `session.revoked` webhook still provides instant revocation; this is the
 * backstop if a webhook is missed.
 */
import type { Request, Response } from 'express';
import type { Session } from 'express-session';

import { promisify } from 'util';

import { logout } from 'server/utils/logout';
import { isDevelopment, isDuqDuq } from 'utils/environment';

import { decryptPayload, encryptPayload, introspectRefreshToken } from './oidc.server';

// Worst-case revocation/ban latency if the webhook is missed. Short in dev /
// duqduq for fast testing; a few minutes in prod. Override with
// KF_REVALIDATE_MS for local testing.
export const KF_REVALIDATE_MS = process.env.KF_REVALIDATE_MS
	? Number(process.env.KF_REVALIDATE_MS)
	: isDevelopment()
		? 20 * 1000
		: isDuqDuq()
			? 60 * 1000
			: 5 * 60 * 1000;

// Back off this long after a transient (network / timeout / 5xx) check failure.
const TRANSIENT_RETRY_MS = 30 * 1000;

/**
 * Store the refresh token (encrypted) + kf session id on the session and
 * schedule the first liveness check. Called at login (callback / session-set).
 * The token is never rewritten afterwards (introspection doesn't rotate it), so
 * keeping it on the session blob is safe.
 */
export function setKfSessionTokens(
	req: Request,
	opts: { refreshToken?: string | null; kfSessionId?: string | null },
): void {
	if (opts.kfSessionId) {
		req.session.kfSessionId = opts.kfSessionId;
	}
	if (!opts.refreshToken) return;
	req.session.kfRefreshToken = encryptPayload({ t: opts.refreshToken });
	req.session.kfNextCheck = Date.now() + KF_REVALIDATE_MS;
}

// In-process single-flight: collapse concurrent checks for the same session
// (e.g. a page firing many parallel requests) into one introspection call.
const inFlight = new Map<string, Promise<boolean>>();

/**
 * Check the session against kf-auth if it's due. Returns true if the session is
 * (still) valid, false if it was torn down. Never throws.
 */
export async function checkKfSession(req: Request, res: Response): Promise<boolean> {
	const session = req.session;
	// Not an OIDC session (e.g. bearer-token API access) — nothing to check.
	if (!session?.kfRefreshToken) return true;
	if (Date.now() < (session.kfNextCheck ?? 0)) return true; // still fresh

	const sid = req.sessionID;
	const existing = inFlight.get(sid);
	if (existing) return existing;

	const p = doCheck(req, res).finally(() => inFlight.delete(sid));
	inFlight.set(sid, p);
	return p;
}

async function doCheck(req: Request, res: Response): Promise<boolean> {
	const session = req.session;
	const decrypted = decryptPayload<{ t: string }>(session.kfRefreshToken ?? '');
	if (!decrypted?.t) {
		teardown(req, res);
		return false;
	}

	try {
		const { active, sid } = await introspectRefreshToken(decrypted.t);
		// `active` goes false on revoke/expire; `sid` is nulled when the backing
		// session is gone. Either means the kf-auth session no longer exists.
		if (!active || !sid) {
			teardown(req, res);
			return false;
		}
	} catch {
		// Transient (network / timeout / 5xx) — keep the session, retry shortly.
		session.kfNextCheck = Date.now() + TRANSIENT_RETRY_MS;
		await saveSession(session);
		return true;
	}

	session.kfNextCheck = Date.now() + KF_REVALIDATE_MS;
	await saveSession(session);
	return true;
}

function teardown(req: Request, res: Response): void {
	// logout() clears req.user and flips the pp-lic CDN marker to logged-out.
	// req.user being cleared means subsequent requests skip the check entirely
	// (the middleware only runs when req.user is set).
	try {
		logout(req, res);
	} catch {
		/* best-effort */
	}
}

async function saveSession(session: Session): Promise<void> {
	try {
		await promisify(session.save.bind(session))();
	} catch {
		/* best-effort — a failed save just means we re-check sooner */
	}
}
