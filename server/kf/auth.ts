/**
 * Lightweight OIDC client for KF Auth (PubPub edition).
 *
 * Two base URLs:
 *   KF_AUTH_INTERNAL_URL — server-to-server (e.g. kf-auth:3000 on Hetzner internal network)
 *   KF_AUTH_URL          — browser-facing  (e.g. https://auth.knowledgefutures.org)
 */

import crypto from 'node:crypto';

/** Browser-facing URL for auth redirects. */
const KF_AUTH_URL = process.env.KF_AUTH_URL ?? 'http://localhost:3000';
/** Server-side URL for token exchange / userinfo. Falls back to KF_AUTH_URL. */
const KF_AUTH_INTERNAL_URL = process.env.KF_AUTH_INTERNAL_URL ?? KF_AUTH_URL;
const KF_AUTH_CLIENT_ID = process.env.KF_AUTH_CLIENT_ID ?? 'kf_pubpub';
const KF_AUTH_CLIENT_SECRET = process.env.KF_AUTH_CLIENT_SECRET ?? '';
const APP_URL = process.env.APP_URL ?? 'http://localhost:9876';
const REDIRECT_URI = `${APP_URL}/auth/callback`;

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
 * `state` should include the community subdomain/domain for post-login redirect.
 */
export function buildAuthorizeUrl(state: string): {
	url: string;
	codeVerifier: string;
} {
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = generateCodeChallenge(codeVerifier);
	const params = new URLSearchParams({
		client_id: KF_AUTH_CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		response_type: 'code',
		scope: 'openid profile email',
		state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
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

export async function exchangeCode(
	code: string,
	codeVerifier: string,
): Promise<TokenResponse> {
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: REDIRECT_URI,
		client_id: KF_AUTH_CLIENT_ID,
		client_secret: KF_AUTH_CLIENT_SECRET,
		code_verifier: codeVerifier,
	});

	const res = await fetch(`${KF_AUTH_INTERNAL_URL}${TOKEN_PATH}`, {
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
	const res = await fetch(`${KF_AUTH_INTERNAL_URL}${USERINFO_PATH}`, {
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
export async function fetchUserOrgs(
	userId: string,
): Promise<KFOrg[]> {
	const key = process.env.KF_INTERNAL_API_KEY;
	if (!key) return [];

	const res = await fetch(
		`${KF_AUTH_INTERNAL_URL}/api/internal/users/${userId}/orgs`,
		{
			headers: { Authorization: `Bearer ${key}` },
		},
	);

	if (!res.ok) return [];
	const data = (await res.json()) as { orgs?: KFOrg[] };
	return data.orgs ?? [];
}

export { KF_AUTH_URL, KF_AUTH_CLIENT_ID, APP_URL, REDIRECT_URI };
