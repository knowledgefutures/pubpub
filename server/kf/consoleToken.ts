/**
 * Checks a call from the KF console (webhooks, summary, branding, contexts).
 *
 * Each call carries a `KF-Console-Token` header: an EdDSA JWT signed with KF Auth's
 * keys, bound to PubPub's client id, the method, the URL the console has registered for
 * the call and, for a request with a body, the body's hash. See kf-console's
 * docs/calling-kf.md, "Checking a call from KF".
 */

import { createHash } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { APP_URL, OIDC_CLIENT_ID, OIDC_ISSUER_INTERNAL_URL, OIDC_ISSUER_URL } from './oidc.server';

/** KF Auth's issuer, `<auth origin>/api/auth`, from an auth URL with or without that path. */
export function kfAuthIssuer(authUrl: string): string {
	const base = authUrl.replace(/\/+$/, '');
	return base.endsWith('/api/auth') ? base : `${base}/api/auth`;
}

export const KF_AUTH_ISSUER = kfAuthIssuer(OIDC_ISSUER_URL);

// Fetched server-to-server, so from the internal host. Cached; refetched on a new kid.
export const KF_AUTH_JWKS_URL = `${kfAuthIssuer(OIDC_ISSUER_INTERNAL_URL)}/jwks`;
const keys = createRemoteJWKSet(new URL(KF_AUTH_JWKS_URL));

/** The URL the console registers for a path: the app's public URL, never the request's. */
export function registeredUrl(path: string): string {
	const url = new URL(path, APP_URL);
	return `${url.origin}${url.pathname}`;
}

function sha256Base64Url(body: Buffer): string {
	return createHash('sha256').update(body).digest('base64url');
}

/** Throws unless the request is the console calling `htu` on this app. */
async function verifyConsoleToken(req: any, htu: string): Promise<void> {
	const token = req.headers['kf-console-token'];
	if (typeof token !== 'string' || !token) throw new Error('no KF-Console-Token');

	const { payload } = await jwtVerify(token, keys, {
		issuer: KF_AUTH_ISSUER,
		audience: OIDC_CLIENT_ID,
		subject: 'kf-console',
		algorithms: ['EdDSA'],
		maxTokenAge: 60,
		clockTolerance: 30,
	});
	if (payload.htm !== req.method || payload.htu !== htu) {
		throw new Error('token is for another request');
	}
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		// rawBody is kept by the JSON parser for these routes only (server/server.ts)
		if (!Buffer.isBuffer(req.rawBody)) throw new Error('no raw body to check');
		if (payload.body_sha256 !== sha256Base64Url(req.rawBody)) {
			throw new Error('body does not match the token');
		}
	}
}

/** Paths whose raw JSON body the parser keeps on `req.rawBody`, for the body hash. */
export const RAW_BODY_PATHS = new Set(['/api/kf/webhooks']);

/** Express middleware: 401 unless the request is the console calling `path` on this app. */
export function requireKfConsoleToken(path: string) {
	const htu = registeredUrl(path);
	return async (req: any, res: any, next: () => void) => {
		try {
			await verifyConsoleToken(req, htu);
		} catch {
			res.status(401).json({ error: 'Unauthorized' });
			return;
		}
		next();
	};
}
