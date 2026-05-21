/**
 * Legacy re-export shim for PubPub's OIDC client.
 * New code should import from './oidc.server.js' directly.
 */

export {
	APP_URL,
	buildAuthorizeUrl,
	decryptPayload,
	encryptPayload,
	exchangeCode,
	extractOrgs,
	fetchUserInfo,
	fetchUserOrgs,
	generateCodeChallenge,
	generateCodeVerifier,
	initOidc,
	OIDC_CLIENT_ID,
	OIDC_ISSUER_URL,
	type OIDCOrg as KFOrg,
	type OIDCUserInfo as KFUserInfo,
	REDIRECT_URI,
	type TokenResponse,
} from './oidc.server.js';
