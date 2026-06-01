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
 *   OIDC_ORGS_CLAIM          — custom claim key for org memberships (default: https://knowledgefutures.org/orgs)
 */

import * as crypto from 'node:crypto';

// --- Config (with backward-compat fallbacks) ---

const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL ?? 'http://localhost:3000';

const OIDC_ISSUER_INTERNAL_URL = process.env.OIDC_ISSUER_INTERNAL_URL ?? OIDC_ISSUER_URL;

const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID ?? 'kf_pubpub';

const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET ?? '';

const OIDC_ORGS_CLAIM = process.env.OIDC_ORGS_CLAIM ?? 'https://knowledgefutures.org/orgs';

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
	jwks_uri?: string;
}

let discoveryCache: OIDCDiscovery | null = null;
let discoveryPromise: Promise<OIDCDiscovery> | null = null;

async function discover(): Promise<OIDCDiscovery> {
	if (discoveryCache) return discoveryCache;
	if (discoveryPromise) return discoveryPromise;

	discoveryPromise = (async () => {
		const url = `${OIDC_ISSUER_INTERNAL_URL}/.well-known/openid-configuration`;
		const res = await fetch(url);
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

// --- Symmetric encryption (AES-256-GCM) ---

/** Derive a 32-byte key from the client secret for AES-256-GCM. */
function deriveKey(): Buffer {
	return crypto.createHash('sha256').update(OIDC_CLIENT_SECRET).digest();
}

/** Encrypt a JSON-serializable object → base64url token. */
export function encryptPayload(data: object): string {
	const key = deriveKey();
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
	const plaintext = JSON.stringify(data);
	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

/** Decrypt a base64url token → parsed object, or null on failure. */
export function decryptPayload<T = any>(token: string): T | null {
	try {
		const key = deriveKey();
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
		scope: 'openid profile email',
		state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		...(context && { context }),
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

	const res = await fetch(internalEndpoint(config.token_endpoint), {
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

// --- UserInfo ---

export interface OIDCOrg {
	id: string;
	name: string;
	slug: string;
	type: 'personal' | 'shared';
	role: string;
}

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
	const res = await fetch(internalEndpoint(config.userinfo_endpoint), {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!res.ok) {
		throw new Error(`UserInfo failed: ${res.status}`);
	}

	return res.json() as Promise<OIDCUserInfo>;
}

/** Extract org memberships from the userinfo response. */
export function extractOrgs(userInfo: OIDCUserInfo): OIDCOrg[] {
	const orgs = userInfo[OIDC_ORGS_CLAIM];
	if (Array.isArray(orgs)) return orgs as OIDCOrg[];
	return [];
}

// --- Internal API (optional, for KF Auth specific features) ---

const AUTH_INTERNAL_API_URL = process.env.AUTH_INTERNAL_API_URL ?? OIDC_ISSUER_INTERNAL_URL;

const AUTH_INTERNAL_API_KEY = process.env.AUTH_INTERNAL_API_KEY ?? '';

/** Whether the internal API is configured and available. */
export const hasInternalApi = Boolean(AUTH_INTERNAL_API_KEY);

/**
 * Fetch a user's orgs from the auth provider's internal API.
 * Returns empty array if internal API is not configured.
 */
export async function fetchUserOrgs(userId: string): Promise<OIDCOrg[]> {
	if (!AUTH_INTERNAL_API_KEY) return [];

	const res = await fetch(`${AUTH_INTERNAL_API_URL}/api/internal/users/${userId}/orgs`, {
		headers: { Authorization: `Bearer ${AUTH_INTERNAL_API_KEY}` },
	});

	if (!res.ok) return [];
	const data = (await res.json()) as { orgs?: OIDCOrg[] };
	return data.orgs ?? [];
}

// --- Outbound ban sync ---

export async function syncBanToKfAuth(userId: string, reason?: string): Promise<void> {
	if (!AUTH_INTERNAL_API_KEY) return;

	try {
		const res = await fetch(`${AUTH_INTERNAL_API_URL}/api/internal/users/${userId}/ban`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${AUTH_INTERNAL_API_KEY}`,
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
	if (!AUTH_INTERNAL_API_KEY) return;

	try {
		const res = await fetch(`${AUTH_INTERNAL_API_URL}/api/internal/users/${userId}/unban`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${AUTH_INTERNAL_API_KEY}`,
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
	OIDC_ORGS_CLAIM,
	OIDC_ACCOUNT_URL,
	APP_URL,
	REDIRECT_URI,
};
