/**
 * Lightweight OIDC client for KF Auth (PubPub edition).
 *
 * KF_AUTH_URL is used for both browser redirects and server-side calls
 * (token exchange, userinfo).
 */

import crypto from 'node:crypto';

const KF_AUTH_URL = process.env.KF_AUTH_URL ?? 'http://localhost:3000';
const KF_AUTH_CLIENT_ID = process.env.KF_AUTH_CLIENT_ID ?? 'kf_pubpub';
const KF_AUTH_CLIENT_SECRET = process.env.KF_AUTH_CLIENT_SECRET ?? '';
const APP_URL = process.env.APP_URL ?? 'http://localhost:9876';
const REDIRECT_URI = `${APP_URL}/auth/callback`;

// ── Symmetric encryption (AES-256-GCM) ──────────────────────────────

/** Derive a 32-byte key from the client secret for AES-256-GCM. */
function deriveKey(): Buffer {
	return crypto.createHash('sha256').update(KF_AUTH_CLIENT_SECRET).digest();
}

/** Encrypt a JSON-serializable object → base64url token. */
export function encryptPayload(data: object): string {
	const key = deriveKey();
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
	const plaintext = JSON.stringify(data);
	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	// Layout: iv (12) + tag (16) + ciphertext
	return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

/** Decrypt a base64url token → parsed object, or null on failure. */
export function decryptPayload<T = any>(token: string): T | null {
	try {
		const key = deriveKey();
		const buf = Buffer.from(token, 'base64url');
		if (buf.length < 29) return null; // iv(12) + tag(16) + at least 1 byte
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

// BetterAuth OIDC endpoints
const AUTHORIZE_PATH = '/api/auth/oauth2/authorize';
const TOKEN_PATH = '/api/auth/oauth2/token';
const USERINFO_PATH = '/api/auth/oauth2/userinfo';

// ── PKCE helpers ─────────────────────────────────────────────────────

export function generateCodeVerifier(): string {
	return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
	return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ── Authorize URL ────────────────────────────────────────────────────

/**
 * Build the URL to redirect the user to for authentication.
 * `state` is the OIDC state parameter (encrypted payload with verifier + routing info).
 * `existingVerifier` allows passing a pre-generated verifier (when it's encrypted in state).
 */
export function buildAuthorizeUrl(
	state: string,
	existingVerifier?: string,
	context?: string,
): {
	url: string;
	codeVerifier: string;
} {
	const codeVerifier = existingVerifier ?? generateCodeVerifier();
	const codeChallenge = generateCodeChallenge(codeVerifier);
	const params = new URLSearchParams({
		client_id: KF_AUTH_CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		response_type: 'code',
		scope: 'openid profile email',
		state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		...(context && { context }),
	});
	return { url: `${KF_AUTH_URL}${AUTHORIZE_PATH}?${params}`, codeVerifier };
}

// ── Token exchange ───────────────────────────────────────────────────

interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	id_token?: string;
	refresh_token?: string;
}

export async function exchangeCode(code: string, codeVerifier: string): Promise<TokenResponse> {
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: REDIRECT_URI,
		client_id: KF_AUTH_CLIENT_ID,
		client_secret: KF_AUTH_CLIENT_SECRET,
		code_verifier: codeVerifier,
	});

	const res = await fetch(`${KF_AUTH_URL}${TOKEN_PATH}`, {
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

// ── UserInfo ─────────────────────────────────────────────────────────

export interface KFOrg {
	id: string;
	name: string;
	slug: string;
	type: 'personal' | 'shared';
	role: string;
}

export interface KFUserInfo {
	sub: string;
	name?: string;
	email?: string;
	picture?: string;
	given_name?: string;
	family_name?: string;
	'https://knowledgefutures.org/orgs'?: KFOrg[];
}

export async function fetchUserInfo(accessToken: string): Promise<KFUserInfo> {
	const res = await fetch(`${KF_AUTH_URL}${USERINFO_PATH}`, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!res.ok) {
		throw new Error(`UserInfo failed: ${res.status}`);
	}

	return res.json() as Promise<KFUserInfo>;
}

/**
 * Fetch a user's current KF orgs from KF Auth's internal API.
 * Used for the ownership picker when creating communities.
 */
export async function fetchUserOrgs(userId: string): Promise<KFOrg[]> {
	const key = process.env.KF_INTERNAL_API_KEY;
	if (!key) return [];

	const res = await fetch(`${KF_AUTH_URL}/api/internal/users/${userId}/orgs`, {
		headers: { Authorization: `Bearer ${key}` },
	});

	if (!res.ok) return [];
	const data = (await res.json()) as { orgs?: KFOrg[] };
	return data.orgs ?? [];
}

export { KF_AUTH_URL, KF_AUTH_CLIENT_ID, APP_URL, REDIRECT_URI };
