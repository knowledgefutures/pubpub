/**
 * Legacy re-export shim for PubPub's OIDC client.
 * New code should import from './oidc.server.js' directly.
 */

export {
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
	APP_URL,
	KF_AUTH_CLIENT_ID,
	KF_AUTH_URL,
	REDIRECT_URI,
	type OIDCOrg as KFOrg,
	type OIDCUserInfo as KFUserInfo,
	type TokenResponse,
} from './oidc.server.js';

