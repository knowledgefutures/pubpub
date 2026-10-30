/**
 * Generic OIDC client with auto-discovery (PubPub edition).
 *
 * Reads endpoints from the provider's .well-known/openid-configuration.
 * Works with any standards-compliant OIDC provider (KF Auth, Keycloak, Auth0, etc.).
 *
 * Env vars:
 *   OIDC_ISSUER_URL          — browser-facing issuer URL
 *   OIDC_ISSUER_INTERNAL_URL — server-to-server URL for Docker (falls back to OIDC_ISSUER_URL)
 *   OIDC_CLIENT_ID           — OAuth client ID
 *   OIDC_CLIENT_SECRET       — OAuth client secret
 *   KF_SESSION_ENCRYPTION_KEY — key for the encrypted OIDC state, session-set
 *                               and refresh tokens (see "Symmetric encryption")
 */

import * as crypto from 'node:crypto';

// --- Config (with backward-compat fallbacks) ---

const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL ?? 'http://localhost:3000';

const OIDC_ISSUER_INTERNAL_URL = process.env.OIDC_ISSUER_INTERNAL_URL ?? OIDC_ISSUER_URL;

const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID ?? 'kf_pubpub';

const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET ?? '';

const OIDC_ROLE_CLAIM = process.env.OIDC_ROLE_CLAIM ?? 'https://knowledgefutures.org/role';

const APP_URL = process.env.APP_URL ?? 'http://localhost:9876';
const REDIRECT_URI = `${APP_URL}/auth/callback`;

// Browser-facing URL of the KF Account app, where users manage their
// profile, email, and password. Distinct from the OIDC issuer.
const OIDC_ACCOUNT_URL = process.env.OIDC_ACCOUNT_URL ?? 'http://localhost:3001';

// --- OIDC Discovery ---

interface OIDCDiscovery {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint: string;
	introspection_endpoint?: string;
	jwks_uri?: string;
}

let discoveryCache: OIDCDiscovery | null = null;
let discoveryPromise: Promise<OIDCDiscovery> | null = null;

async function discover(): Promise<OIDCDiscovery> {
	if (discoveryCache) return discoveryCache;
	if (discoveryPromise) return discoveryPromise;

	discoveryPromise = (async () => {
		const url = `${OIDC_ISSUER_INTERNAL_URL}/.well-known/openid-configuration`;
		const res = await fetchWithTimeout(url);
		if (!res.ok) {
			throw new Error(
				`OIDC discovery failed: ${res.status} from ${url}. ` +
					`Ensure OIDC_ISSUER_URL points to a valid OIDC provider.`,
			);
		}
		const config = (await res.json()) as OIDCDiscovery;
		discoveryCache = config;
		return config;
	})().catch((err) => {
		// Clear the cached promise so subsequent calls can retry
		discoveryPromise = null;
		throw err;
	});

	return discoveryPromise;
}

/** Pre-warm OIDC discovery cache. Non-fatal — discovery will be retried on demand. */
export async function initOidc(): Promise<void> {
	await discover();
}

/**
 * Rewrite a discovered endpoint URL to use the internal host.
 * Discovery may return URLs with the public host (BETTER_AUTH_URL),
 * but server-to-server calls must use OIDC_ISSUER_INTERNAL_URL.
 */
function internalEndpoint(discoveredUrl: string): string {
	const url = new URL(discoveredUrl);
	const base = new URL(OIDC_ISSUER_INTERNAL_URL);
	url.protocol = base.protocol;
	url.host = base.host;
	return url.toString();
}

// Server-to-server calls to kf-auth MUST be bounded: without a timeout a slow
// or unreachable kf-auth hangs the request indefinitely (and, on the session
// refresh path, the in-process single-flight makes every other request for that
// session hang on the same pending promise). 8s is generous for a token call.
const KF_FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(
	input: string,
	init?: Parameters<typeof fetch>[1],
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), KF_FETCH_TIMEOUT_MS);
	try {
		return await fetch(input, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

// --- Symmetric encryption (AES-256-GCM) ---
//
// Encrypts the OIDC state (which carries the PKCE verifier), the one-time
// custom-domain session-set token, and the refresh token stored on the session
// (sessionCheck.ts).
//
// The key is KF_SESSION_ENCRYPTION_KEY: 32 random bytes, base64
// (`openssl rand -base64 32`). It used to be derived from OIDC_CLIENT_SECRET,
// so rolling the client secret logged everyone out. New values are encrypted
// with the dedicated key when it is set; decryption tries it first and falls
// back to the derived key, so nothing written before it was set breaks.
// Without it, behaviour is unchanged.
//
// TODO(session-key-fallback): once KF_SESSION_ENCRYPTION_KEY has been set in
// production for longer than kf-auth's refresh-token lifetime (30 days), every
// value under the derived key has been re-encrypted or has expired. Then remove
// legacyDerivedKey() and the fallback and make the env var required. Only after
// that can the client secret roll without logging anyone out.

/** The dedicated session key, or null when it isn't configured. */
function sessionKey(): Buffer | null {
	const raw = process.env.KF_SESSION_ENCRYPTION_KEY;
	if (!raw) return null;
	const key = Buffer.from(raw, 'base64');
	if (key.length !== 32) {
		throw new Error(
			'KF_SESSION_ENCRYPTION_KEY must be 32 bytes, base64-encoded (openssl rand -base64 32)',
		);
	}
	return key;
}

/** The key used before KF_SESSION_ENCRYPTION_KEY, derived from the client secret. */
function legacyDerivedKey(): Buffer {
	return crypto.createHash('sha256').update(OIDC_CLIENT_SECRET).digest();
}

/** Encrypt a JSON-serializable object → base64url token. */
export function encryptPayload(data: object): string {
	const key = sessionKey() ?? legacyDerivedKey();
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
	const plaintext = JSON.stringify(data);
	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decryptWithKey<T>(token: string, key: Buffer): T | null {
	try {
		const buf = Buffer.from(token, 'base64url');
		if (buf.length < 29) return null;
		const iv = buf.subarray(0, 12);
		const tag = buf.subarray(12, 28);
		const ciphertext = buf.subarray(28);
		const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(tag);
		const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
		return JSON.parse(decrypted.toString('utf8')) as T;
	} catch {
		return null;
	}
}

/**
 * Decrypt a base64url token, also saying whether it should be re-encrypted:
 * true when it was written under the derived key while the dedicated key is
 * set. Null on failure.
 */
export function decryptPayloadWithKeyInfo<T = any>(
	token: string,
): { data: T; needsReencrypt: boolean } | null {
	const key = sessionKey();
	if (key) {
		const data = decryptWithKey<T>(token, key);
		if (data !== null) return { data, needsReencrypt: false };
	}
	// TODO(session-key-fallback): remove with legacyDerivedKey().
	const data = decryptWithKey<T>(token, legacyDerivedKey());
	if (data === null) return null;
	return { data, needsReencrypt: key !== null };
}

/** Decrypt a base64url token → parsed object, or null on failure. */
export function decryptPayload<T = any>(token: string): T | null {
	return decryptPayloadWithKeyInfo<T>(token)?.data ?? null;
}

// --- PKCE helpers ---

export function generateCodeVerifier(): string {
	return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
	return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// --- OIDC Flows ---

/**
 * Build the URL to redirect the user to for authentication.
 * Uses the discovered authorization_endpoint (browser-facing).
 */
export async function buildAuthorizeUrl(
	state: string,
	existingVerifier?: string,
	context?: string,
	prompt?: string,
): Promise<{ url: string; codeVerifier: string }> {
	const config = await discover();
	const codeVerifier = existingVerifier ?? generateCodeVerifier();
	const codeChallenge = generateCodeChallenge(codeVerifier);

	// Use browser-facing URL for authorize endpoint
	const authorizeUrl = new URL(config.authorization_endpoint);
	const browserBase = new URL(OIDC_ISSUER_URL);
	authorizeUrl.protocol = browserBase.protocol;
	authorizeUrl.host = browserBase.host;

	const params = new URLSearchParams({
		client_id: OIDC_CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		response_type: 'code',
		// offline_access makes kf-auth issue a refresh token (Better Auth gates
		// refresh-token issuance on this scope). PubPub is a confidential,
		// server-side client, so it renews the session via the refresh_token
		// grant server-to-server — no browser redirect / third-party-cookie dance.
		scope: 'openid profile email offline_access',
		state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		...(context && { context }),
		...(prompt && { prompt }),
	});

	return { url: `${authorizeUrl.toString()}?${params}`, codeVerifier };
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	id_token?: string;
	refresh_token?: string;
}

/**
 * Extract claims from the ID token without signature verification —
 * the token came straight from the token endpoint over a trusted
 * server-to-server channel, so its contents are already authentic.
 * `sid` is the kf-auth session id (requires enableEndSession on the
 * OAuth client); it lets us correlate local sessions with kf-auth
 * sessions for the session.revoked webhook.
 */
export function decodeIdTokenClaims(idToken: string): { sub?: string; sid?: string } {
	try {
		const payloadPart = idToken.split('.')[1];
		if (!payloadPart) return {};
		const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
		return {
			sub: typeof payload.sub === 'string' ? payload.sub : undefined,
			sid: typeof payload.sid === 'string' ? payload.sid : undefined,
		};
	} catch {
		return {};
	}
}

/**
 * Exchange an authorization code for tokens (server-to-server).
 */
export async function exchangeCode(code: string, codeVerifier: string): Promise<TokenResponse> {
	const config = await discover();
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: REDIRECT_URI,
		client_id: OIDC_CLIENT_ID,
		client_secret: OIDC_CLIENT_SECRET,
		code_verifier: codeVerifier,
	});

	const res = await fetchWithTimeout(internalEndpoint(config.token_endpoint), {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body,
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Token exchange failed: ${res.status} ${text}`);
	}

	return res.json() as Promise<TokenResponse>;
}

export interface IntrospectionResult {
	/** kf-auth says the token (and its session) is live. */
	active: boolean;
	/** kf-auth session id, present only while the session itself is live. */
	sid?: string;
}

/**
 * RFC 7662 token introspection of a refresh token (server-to-server).
 *
 * This is a READ-ONLY liveness check — unlike the refresh_token grant it does
 * NOT rotate the token, so it's idempotent and safe to call concurrently from
 * any number of instances. kf-auth returns `active: false` once the refresh
 * token is revoked (our session.delete hook revokes it when the kf-auth session
 * is revoked / the user is banned) or expired, and nulls `sid` when the backing
 * session is gone. We treat "not active" OR "no sid" as dead.
 *
 * Throws on transient failure (network / timeout / non-2xx) — the caller keeps
 * the session and retries on the next cycle (fail-open on a kf-auth blip).
 */
export async function introspectRefreshToken(refreshToken: string): Promise<IntrospectionResult> {
	const config = await discover();
	const endpoint =
		config.introspection_endpoint ?? config.token_endpoint.replace(/\/token$/, '/introspect');
	const body = new URLSearchParams({
		token: refreshToken,
		token_type_hint: 'refresh_token',
		client_id: OIDC_CLIENT_ID,
		client_secret: OIDC_CLIENT_SECRET,
	});

	const res = await fetchWithTimeout(internalEndpoint(endpoint), {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body,
	});

	if (!res.ok) {
		throw new Error(`Introspection failed: ${res.status} ${await res.text()}`);
	}

	const json = (await res.json()) as { active?: boolean; sid?: string };
	return { active: json.active === true, sid: json.sid };
}

// --- UserInfo ---

export interface OIDCUserInfo {
	sub: string;
	name?: string;
	email?: string;
	picture?: string;
	given_name?: string;
	family_name?: string;
	[key: string]: unknown;
}

export async function fetchUserInfo(accessToken: string): Promise<OIDCUserInfo> {
	const config = await discover();
	const res = await fetchWithTimeout(internalEndpoint(config.userinfo_endpoint), {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!res.ok) {
		throw new Error(`UserInfo failed: ${res.status}`);
	}

	return res.json() as Promise<OIDCUserInfo>;
}

// --- Internal API (optional, for KF Auth specific features) ---

const AUTH_INTERNAL_API_URL = process.env.AUTH_INTERNAL_API_URL ?? OIDC_ISSUER_INTERNAL_URL;

/**
 * PubPub calls KF's internal API as its own OAuth client: HTTP Basic with the client
 * id and secret. Null when no secret is configured, which turns those calls off.
 */
export function kfClientAuthorization(): string | null {
	if (!OIDC_CLIENT_SECRET) return null;
	const credentials = Buffer.from(`${OIDC_CLIENT_ID}:${OIDC_CLIENT_SECRET}`).toString('base64');
	return `Basic ${credentials}`;
}

// --- KF Accounts ---

export interface OIDCOrg {
	id: string;
	name: string;
	slug: string;
	type: 'personal' | 'shared';
	role: string;
}

/** The KF Accounts (console orgs) a user belongs to. Empty without client credentials. */
export async function fetchUserOrgs(userId: string): Promise<OIDCOrg[]> {
	const authorization = kfClientAuthorization();
	if (!authorization) return [];

	const res = await fetch(`${AUTH_INTERNAL_API_URL}/api/internal/users/${userId}/orgs`, {
		headers: { Authorization: authorization },
	});

	if (!res.ok) return [];
	const data = (await res.json()) as { orgs?: OIDCOrg[] };
	return data.orgs ?? [];
}

// --- Outbound ban sync ---

export async function syncBanToKfAuth(userId: string, reason?: string): Promise<void> {
	const authorization = kfClientAuthorization();
	if (!authorization) return;

	try {
		const res = await fetch(`${AUTH_INTERNAL_API_URL}/api/internal/users/${userId}/ban`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authorization,
			},
			body: JSON.stringify({ reason: reason ?? 'banned via PubPub spam system' }),
		});
		if (!res.ok) {
			const text = await res.text();
			console.error(`syncBanToKfAuth failed for ${userId}: HTTP ${res.status} ${text}`);
		}
	} catch (err) {
		console.error(`syncBanToKfAuth failed for ${userId}:`, err);
	}
}

export async function syncUnbanToKfAuth(userId: string): Promise<void> {
	const authorization = kfClientAuthorization();
	if (!authorization) return;

	try {
		const res = await fetch(`${AUTH_INTERNAL_API_URL}/api/internal/users/${userId}/unban`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authorization,
			},
			body: JSON.stringify({}),
		});
		if (!res.ok) {
			const text = await res.text();
			console.error(`syncUnbanToKfAuth failed for ${userId}: HTTP ${res.status} ${text}`);
		}
	} catch (err) {
		console.error(`syncUnbanToKfAuth failed for ${userId}:`, err);
	}
}

// --- Exports ---

export {
	OIDC_ISSUER_URL,
	OIDC_ISSUER_INTERNAL_URL,
	OIDC_CLIENT_ID,
	OIDC_CLIENT_SECRET,
	OIDC_ROLE_CLAIM,
	OIDC_ACCOUNT_URL,
	APP_URL,
	REDIRECT_URI,
};
