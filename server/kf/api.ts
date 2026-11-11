/**
 * KF Auth integration routes for PubPub.
 *
 * OIDC login/callback:
 *   GET  /auth/login       — redirect to KF Auth
 *   GET  /auth/callback    — handle OIDC callback, create session
 *   GET  /auth/session-set — establish session on custom domains (via encrypted token)
 *   POST /auth/logout      — clear session + redirect to KF Auth logout
 *
 * Calls from the KF console, each checked by its KF-Console-Token (./consoleToken):
 *   POST /api/kf/webhooks             — receive webhook events from KF Auth (profile, bans, sessions)
 *   GET  /api/kf/branding             — return community branding for login page
 *   GET  /api/kf/contexts             — list communities (local dev)
 *   GET  /api/kf/summary              — a KF Account's orgs and communities (console org-assets)
 *   GET  /api/kf/usage                — a KF Account's billable usage (nothing calls it yet)
 */

import { Router } from 'express';
import { promisify } from 'util';

import { Community, User } from 'server/models';
import { getKfAccountSummary, getKfAccountUsage } from 'server/org/kfQueries';
import { logout } from 'server/utils/logout';
import { getHashedUserId } from 'utils/caching/getHashedUserId';
import { isDevelopment, isDuqDuq, isProd } from 'utils/environment';

import { requireKfConsoleToken } from './consoleToken';
import {
	buildAuthorizeUrl,
	decodeIdTokenClaims,
	decryptPayload,
	encryptPayload,
	exchangeCode,
	fetchUserInfo,
	generateCodeVerifier,
	OIDC_ISSUER_URL,
} from './oidc.server';
import { provisionLocalUser } from './provisionLocalUser';
import { setKfSessionTokens } from './sessionCheck';
import {
	handleSessionRevoked,
	handleUserBanned,
	handleUserSessionsRevoked,
	handleUserUnbanned,
	handleUserUpdated,
} from './webhookHandlers';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Derive the community hostname the user came from.
 * Needed because the OIDC callback always hits the main domain.
 * Note: PubPub's hostname middleware rewrites duqduq.org → pubpub.org
 * for community resolution, so we reverse that here.
 */
function getCommunityHost(req: any): string {
	const host: string = req.headers.communityhostname || req.hostname;
	if (isDuqDuq() && host.includes('pubpub.org')) {
		return host.replace('pubpub.org', 'duqduq.org');
	}
	return host;
}

/**
 * Returns true if the host is a platform subdomain (*.pubpub.org or *.duqduq.org)
 * where the shared session cookie works across subdomains.
 */
function isPlatformSubdomain(host: string): boolean {
	return host.endsWith('.pubpub.org') || host.endsWith('.duqduq.org');
}

// ── Router ───────────────────────────────────────────────────────────

export const router = Router();

// ─── OIDC login ──────────────────────────────────────────────────────

router.get('/auth/login', async (req: any, res: any) => {
	const communityHost = getCommunityHost(req);
	const rawReturn = req.query.return_to || '/';
	const returnTo =
		typeof rawReturn === 'string' && rawReturn.startsWith('/') && !rawReturn.startsWith('//')
			? rawReturn
			: '/';

	const codeVerifier = generateCodeVerifier();
	const stateToken = encryptPayload({
		v: codeVerifier,
		h: communityHost,
		r: returnTo,
	});

	const { url } = await buildAuthorizeUrl(stateToken, codeVerifier, communityHost);

	return res.redirect(url);
});

// ─── OIDC callback ───────────────────────────────────────────────────

router.get('/auth/callback', async (req: any, res: any) => {
	try {
		const { code, state, error } = req.query;

		if (error) {
			console.error('KF Auth error:', error, req.query.error_description);
			return res.status(400).send('Authentication failed. Please try again.');
		}

		if (!code || !state) {
			return res.status(400).send('Missing authentication parameters.');
		}

		const stateData = decryptPayload<{
			v: string;
			h: string;
			r: string;
		}>(state);
		if (!stateData || !stateData.v) {
			return res.status(400).send('Invalid or expired authentication state.');
		}

		const { v: codeVerifier, h: host, r: rawReturn } = stateData;
		const returnTo =
			typeof rawReturn === 'string' &&
			rawReturn.startsWith('/') &&
			!rawReturn.startsWith('//')
				? rawReturn
				: '/';

		// Exchange authorization code for tokens
		const tokens = await exchangeCode(code, codeVerifier);

		// Fetch user info from KF Auth
		const userInfo = await fetchUserInfo(tokens.access_token);
		const kfUserId = userInfo.sub;

		const user = await provisionLocalUser(kfUserId, userInfo);

		// kf-auth session id from the ID token's sid claim — stored on the
		// local session so the session.revoked webhook can target it.
		const kfSessionId = tokens.id_token
			? (decodeIdTokenClaims(tokens.id_token).sid ?? null)
			: null;

		const protocol = isDevelopment() ? 'http' : 'https';

		// For custom domains, we can't set a session here (different domain).
		// Create a one-time encrypted token and redirect to session-set on the origin.
		if (host && !isPlatformSubdomain(host)) {
			const sessionToken = encryptPayload({
				u: user.id,
				r: returnTo,
				s: kfSessionId,
				// Hand the refresh token to the custom-domain origin so it can
				// store it on the session it creates (server-side revalidation
				// needs it there, not here on the platform domain).
				rt: tokens.refresh_token,
				exp: Date.now() + 60_000, // 60 seconds
			});
			const sessionSetUrl = `${protocol}://${host}/auth/session-set?token=${encodeURIComponent(sessionToken)}`;
			return res.redirect(sessionSetUrl);
		}

		// For platform subdomains: create session directly (shared cookie on .pubpub.org / .duqduq.org)
		const logIn = promisify(req.logIn.bind(req));
		await logIn(user);

		// Store the refresh token + kf session id and schedule revalidation.
		setKfSessionTokens(req, {
			refreshToken: tokens.refresh_token,
			kfSessionId,
		});

		const hashedUserId = getHashedUserId(user);
		res.cookie('pp-lic', `pp-li-${hashedUserId}`, {
			...(isProd() && { domain: '.pubpub.org' }),
			...(isDuqDuq() && { domain: '.duqduq.org' }),
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		if (host && host !== req.hostname) {
			return res.redirect(`${protocol}://${host}${returnTo}`);
		}
		return res.redirect(returnTo);
	} catch (err: any) {
		console.error('OIDC callback error:', err);
		const detail = isDuqDuq() ? ` (${err?.message || err})` : '';
		return res.status(500).send(`Login failed. Please try again.${detail}`);
	}
});

// ─── Session transfer for custom domains ─────────────────────────────

router.get('/auth/session-set', async (req: any, res: any) => {
	try {
		const { token } = req.query;
		if (!token) {
			return res.status(400).send('Missing session token.');
		}

		const data = decryptPayload<{
			u: string;
			r: string;
			s?: string | null;
			rt?: string | null;
			exp: number;
		}>(token);
		if (!data || !data.u) {
			return res.status(400).send('Invalid session token.');
		}

		if (Date.now() > data.exp) {
			return res.status(400).send('Session token expired. Please log in again.');
		}

		const user = await User.findOne({ where: { id: data.u } });
		if (!user) {
			return res.status(400).send('User not found.');
		}

		// Create Passport session on this domain
		const logIn = promisify(req.logIn.bind(req));
		await logIn(user);

		// Store the refresh token + kf session id and schedule revalidation
		// (this origin is where server-side revalidation will run).
		setKfSessionTokens(req, { refreshToken: data.rt, kfSessionId: data.s });

		// Set the CDN cache cookie on this domain
		const hashedUserId = getHashedUserId(user);
		res.cookie('pp-lic', `pp-li-${hashedUserId}`, {
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		const returnTo = data.r || '/';
		return res.redirect(returnTo);
	} catch (err) {
		console.error('Session-set error:', err);
		return res.status(500).send('Failed to establish session. Please try again.');
	}
});

// ─── Logout ──────────────────────────────────────────────────────────

router.post('/auth/logout', (req, res: any) => {
	// Clear local session
	logout(req, res);
	const returnUrl = `${process.env.APP_URL || 'http://localhost:9876'}/`;
	return res.redirect(
		`${OIDC_ISSUER_URL}/auth/signout?redirect_uri=${encodeURIComponent(returnUrl)}`,
	);
});

// ─── Calls from the KF console ──────────────────────────────────────

// Every method on these paths needs a KF-Console-Token for that path's registered URL.
for (const path of [
	'/api/kf/webhooks',
	'/api/kf/summary',
	'/api/kf/usage',
	'/api/kf/contexts',
	'/api/kf/branding',
]) {
	router.all(path, requireKfConsoleToken(path));
}

// ─── Webhooks from KF Auth ──────────────────────────────────────────

router.post('/api/kf/webhooks', async (req: any, res: any) => {
	const event = req.headers['x-kf-webhook-event'];
	const { data } = req.body;

	if (!event || !data) {
		return res.status(400).json({ error: 'Missing event header or data' });
	}

	try {
		switch (event) {
			case 'user.updated':
				return await handleUserUpdated(data, res);
			case 'user.banned':
				return await handleUserBanned(data, res);
			case 'user.unbanned':
				return await handleUserUnbanned(data, res);
			case 'user.sessions-revoked':
				return await handleUserSessionsRevoked(data, res);
			case 'session.revoked':
				return await handleSessionRevoked(data, res);
			default:
				return res.status(200).json({ ok: true, ignored: true });
		}
	} catch (err) {
		console.error(`Webhook handler error [${event}]:`, err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── KF Account summary and usage (for the console) ─────────────────

router.get('/api/kf/summary', async (req: any, res: any) => {
	try {
		const { kf_org_id } = req.query;
		if (!kf_org_id || typeof kf_org_id !== 'string') {
			return res.status(400).json({ error: 'kf_org_id is required' });
		}
		return res.json({ accounts: await getKfAccountSummary(kf_org_id) });
	} catch (err) {
		console.error('Summary API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

/** ?kf_org_id=…[&since=ISO date][&until=ISO date]; the window limits DOI deposits */
router.get('/api/kf/usage', async (req: any, res: any) => {
	try {
		const { kf_org_id, since, until } = req.query;
		if (!kf_org_id || typeof kf_org_id !== 'string') {
			return res.status(400).json({ error: 'kf_org_id is required' });
		}
		const parseDate = (value: unknown) => {
			if (value === undefined) return undefined;
			const date = new Date(String(value));
			return Number.isNaN(date.getTime()) ? null : date;
		};
		const window = { since: parseDate(since), until: parseDate(until) };
		if (window.since === null || window.until === null) {
			return res.status(400).json({ error: 'since and until must be ISO dates' });
		}
		return res.json(
			await getKfAccountUsage(kf_org_id, {
				since: window.since,
				until: window.until,
			}),
		);
	} catch (err) {
		console.error('Usage API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── Context listing (for KF Auth playground) ───────────────────────

router.get('/api/kf/contexts', async (req: any, res: any) => {
	try {
		const communities = await Community.findAll({
			attributes: ['subdomain', 'title', 'avatar'],
			order: [['title', 'ASC']],
			limit: 200,
		});

		return res.json(
			communities.map((c: any) => ({
				slug: c.subdomain,
				title: c.title,
				avatar: c.avatar || null,
			})),
		);
	} catch (err) {
		console.error('Contexts listing error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── Branding API (for KF Auth login page) ───────────────────────────

router.get('/api/kf/branding', async (req: any, res: any) => {
	try {
		const { subdomain, context } = req.query;
		let identifier = context || subdomain;

		if (!identifier) {
			return res.status(400).json({ error: 'subdomain or context param required' });
		}

		// If the identifier looks like a platform hostname, extract the subdomain slug.
		// e.g. "mycommunity.duqduq.org" → "mycommunity", "mycommunity.pubpub.org" → "mycommunity"
		const platformMatch = identifier.match(/^([^.]+)\.(pubpub\.org|duqduq\.org)$/);
		if (platformMatch && platformMatch[1] !== 'www') {
			identifier = platformMatch[1];
		}

		// Try by subdomain slug first
		let community = await Community.findOne({
			where: { subdomain: identifier },
			attributes: [
				'title',
				'avatar',
				'headerLogo',
				'accentColorLight',
				'accentColorDark',
				'subdomain',
			],
		});

		// If not found and identifier looks like a hostname, try as custom domain
		if (!community && identifier.includes('.')) {
			community = await Community.findOne({
				where: { domain: identifier },
				attributes: [
					'title',
					'avatar',
					'headerLogo',
					'accentColorLight',
					'accentColorDark',
					'subdomain',
				],
			});
		}

		if (!community) {
			return res.status(404).json({ error: 'Community not found' });
		}

		return res.json({
			// Fields expected by kf-auth's loadAppContext()
			display_name: community.title,
			logo_url: community.avatar || community.headerLogo || null,
			brand_color: community.accentColorDark || null,
			background_color: community.accentColorLight || null,
			// Extra fields for backwards compat / debugging
			subdomain: community.subdomain,
		});
	} catch (err) {
		console.error('Branding API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});
