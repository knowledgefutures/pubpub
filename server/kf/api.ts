/**
 * KF Auth integration routes for PubPub.
 *
 * OIDC login/callback:
 *   GET  /auth/login     — redirect to KF Auth
 *   GET  /auth/callback  — handle OIDC callback, create session
 *   POST /auth/logout    — clear session + redirect to KF Auth logout
 *
 * Internal service-to-service endpoints (KF_INTERNAL_API_KEY):
 *   POST /api/kf/profile-sync         — receive profile updates from KF Auth
 *   GET  /api/kf/branding             — return community branding for login page
 *   GET  /api/kf/summary              — return community list for a KF org
 *   GET  /api/kf/billing/usage        — return usage stats for billing (placeholder)
 *
 * Session-authenticated endpoints:
 *   GET  /api/kf/my-orgs              — return current user's KF Account memberships
 *   POST /api/kf/transfer-community   — transfer community ownership to a different KF Account
 */

import { timingSafeEqual } from 'crypto';
import { Router } from 'express';
import { promisify } from 'util';

import { Collection, Community, Member, Pub, PubAttribution, Release, User } from 'server/models';
import { sequelize } from 'server/sequelize';
import { getHashedUserId } from 'utils/caching/getHashedUserId';
import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';
import { isDuqDuq, isProd } from 'utils/environment';

import { buildAuthorizeUrl, exchangeCode, fetchUserInfo, fetchUserOrgs, KF_AUTH_URL } from './auth';

// ── Helpers ──────────────────────────────────────────────────────────

const KF_INTERNAL_API_KEY = process.env.KF_INTERNAL_API_KEY;

function requireInternalKey(req: any, res: any, next: () => void): void {
	if (!KF_INTERNAL_API_KEY) {
		res.status(500).json({ error: 'KF_INTERNAL_API_KEY not configured' });
		return;
	}
	const auth = req.headers.authorization;
	const expected = `Bearer ${KF_INTERNAL_API_KEY}`;
	// Use timing-safe comparison to prevent timing attacks on the API key
	if (
		!auth ||
		auth.length !== expected.length ||
		!timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
	) {
		res.status(401).json({ error: 'Unauthorized' });
		return;
	}
	next();
}

/**
 * Derive the community hostname the user came from.
 * Needed because the OIDC callback always hits the main domain.
 */
function getCommunityHost(req: any): string {
	// Use the communityHostname header if set by the reverse proxy,
	// otherwise fall back to the raw hostname.
	return req.headers.communityhostname || req.hostname;
}

// Cookie name for OIDC state (verifier stored in session for custom domain compat)
const STATE_COOKIE = 'kf_oauth_state';

// ── Router ───────────────────────────────────────────────────────────

export const router = Router();

// ─── OIDC login ──────────────────────────────────────────────────────

router.get('/auth/login', (req: any, res: any) => {
	const communityHost = getCommunityHost(req);
	const rawReturn = req.query.return_to || '/';
	// Validate return_to is a safe relative path (prevent open redirect)
	const returnTo =
		typeof rawReturn === 'string' && rawReturn.startsWith('/') && !rawReturn.startsWith('//')
			? rawReturn
			: '/';

	// Encode the community hostname + return path in state so we can
	// redirect back after the OIDC callback.
	const statePayload = JSON.stringify({ host: communityHost, returnTo });
	const stateToken = Buffer.from(statePayload).toString('base64url');

	const { url, codeVerifier } = buildAuthorizeUrl(stateToken);

	const cookieOpts = {
		httpOnly: true,
		secure: isProd(),
		sameSite: 'lax' as const,
		path: '/',
		maxAge: 600_000, // 10 minutes
		// Set on .pubpub.org so the callback (on www.pubpub.org) can read it
		...(isProd() &&
			communityHost.indexOf('pubpub.org') > -1 && {
				domain: '.pubpub.org',
			}),
	};

	res.cookie(STATE_COOKIE, stateToken, cookieOpts);

	// Store verifier in session (not cookie) so it works across domains.
	// Custom domain sessions are scoped to their domain, and the callback
	// hits the same domain since PubPub proxies all requests.
	req.session.kfOauthVerifier = codeVerifier;
	req.session.save(() => {
		return res.redirect(url);
	});
});

// ─── OIDC callback ───────────────────────────────────────────────────

router.get('/auth/callback', async (req: any, res: any) => {
	try {
		const { code, state, error } = req.query;

		if (error) {
			console.error('KF Auth error:', error, req.query.error_description);
			return res.redirect('/login?error=auth_failed');
		}

		if (!code || !state) {
			return res.redirect('/login?error=missing_params');
		}

		// Validate state
		const savedState = req.cookies[STATE_COOKIE];
		const codeVerifier = req.session?.kfOauthVerifier;

		// Clear OIDC state
		res.clearCookie(STATE_COOKIE, { path: '/' });
		if (req.session) {
			delete req.session.kfOauthVerifier;
		}

		if (!savedState || savedState !== state) {
			return res.redirect('/login?error=invalid_state');
		}

		if (!codeVerifier) {
			return res.redirect('/login?error=missing_verifier');
		}

		// Exchange authorization code for tokens
		const tokens = await exchangeCode(code, codeVerifier);

		// Fetch user info from KF Auth
		const userInfo = await fetchUserInfo(tokens.access_token);
		const kfUserId = userInfo.sub;

		// Look up PubPub user by ID (PubPub ID = KF Auth ID after seeding)
		const user = await User.findOne({ where: { id: kfUserId } });

		if (!user) {
			console.error(`No PubPub user found for KF Auth ID: ${kfUserId}`);
			return res.redirect('/login?error=user_not_found');
		}

		// Create a standard Passport session (indistinguishable from old login)
		const logIn = promisify(req.logIn.bind(req));
		await logIn(user);

		// Set the CDN cache cookie
		const hashedUserId = getHashedUserId(user);
		res.cookie('pp-lic', `pp-li-${hashedUserId}`, {
			...(isProd() &&
				req.hostname.indexOf('pubpub.org') > -1 && {
					domain: '.pubpub.org',
				}),
			...(isDuqDuq() &&
				req.hostname.indexOf('duqduq.org') > -1 && {
					domain: '.duqduq.org',
				}),
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		// Parse state to get the community host + return path
		let redirectUrl = '/';
		try {
			const statePayload = JSON.parse(Buffer.from(state, 'base64url').toString());
			const host = statePayload.host || '';
			const rawReturn = statePayload.returnTo || '/';
			// Validate returnTo is a safe relative path
			const returnTo =
				typeof rawReturn === 'string' &&
				rawReturn.startsWith('/') &&
				!rawReturn.startsWith('//')
					? rawReturn
					: '/';

			if (host && host !== req.hostname) {
				// Redirect back to the community the user came from
				const protocol = isProd() ? 'https' : 'http';
				redirectUrl = `${protocol}://${host}${returnTo}`;
			} else {
				redirectUrl = returnTo;
			}
		} catch {
			// If state parsing fails, just go to root
			redirectUrl = '/';
		}

		return res.redirect(redirectUrl);
	} catch (err) {
		console.error('OIDC callback error:', err);
		return res.redirect('/login?error=callback_failed');
	}
});

// ─── Logout ──────────────────────────────────────────────────────────

router.post('/auth/logout', (req: any, res: any) => {
	// Clear local session
	req.logout(() => {
		// Set pp-lic to logged-out state
		res.cookie('pp-lic', 'pp-lo', {
			...(isProd() &&
				req.hostname.indexOf('pubpub.org') > -1 && {
					domain: '.pubpub.org',
				}),
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		// Redirect to KF Auth's logout endpoint so the SSO session is also cleared
		const returnUrl = `${process.env.APP_URL || 'http://localhost:9876'}/`;
		return res.redirect(
			`${KF_AUTH_URL}/api/auth/sign-out?callbackURL=${encodeURIComponent(returnUrl)}`,
		);
	});
});

// ─── Profile sync (webhook from KF Auth) ─────────────────────────────

router.post('/api/kf/profile-sync', requireInternalKey, async (req: any, res: any) => {
	try {
		const { userId, givenName, familyName, displayName, email, image } = req.body;

		if (!userId) {
			return res.status(400).json({ error: 'userId is required' });
		}

		const user = await User.findOne({ where: { id: userId } });
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const updates: Record<string, any> = {};
		if (displayName !== undefined) updates.fullName = displayName;
		if (givenName !== undefined) updates.firstName = givenName;
		if (familyName !== undefined) updates.lastName = familyName;
		if (email !== undefined) updates.email = email.toLowerCase();
		if (image !== undefined) updates.avatar = image;

		// Recalculate initials when name changes
		if (givenName !== undefined || familyName !== undefined || displayName !== undefined) {
			const first = givenName ?? user.firstName ?? '';
			const last = familyName ?? user.lastName ?? '';
			if (first || last) {
				updates.initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
			}
		}

		if (Object.keys(updates).length > 0) {
			await user.update(updates);
		}

		return res.status(200).json({ ok: true });
	} catch (err) {
		console.error('Profile sync error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── Branding API (for KF Auth login page) ───────────────────────────

router.get('/api/kf/branding', requireInternalKey, async (req: any, res: any) => {
	try {
		const { subdomain, context } = req.query;
		const slug = context || subdomain;

		if (!slug) {
			return res.status(400).json({ error: 'subdomain or context param required' });
		}

		const community = await Community.findOne({
			where: { subdomain: slug },
			attributes: [
				'title',
				'avatar',
				'headerLogo',
				'accentColorLight',
				'accentColorDark',
				'subdomain',
			],
		});

		if (!community) {
			return res.status(404).json({ error: 'Community not found' });
		}

		return res.json({
			communityName: community.title,
			logoUrl: community.avatar || community.headerLogo,
			accentColorLight: community.accentColorLight,
			accentColorDark: community.accentColorDark,
			headerLogo: community.headerLogo,
			subdomain: community.subdomain,
		});
	} catch (err) {
		console.error('Branding API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── Summary API (for KF Account roster / Hub) ──────────────────────

router.get('/api/kf/summary', requireInternalKey, async (req: any, res: any) => {
	try {
		const { kf_org_id } = req.query;
		if (!kf_org_id) {
			return res.status(400).json({ error: 'kf_org_id is required' });
		}

		const communities = await Community.findAll({
			where: { kfOrgId: kf_org_id },
			attributes: ['id', 'title', 'subdomain', 'domain', 'avatar'],
		});

		const accounts = await Promise.all(
			communities.map(async (community: any) => {
				const [pubCount, memberCount] = await Promise.all([
					Pub.count({ where: { communityId: community.id } }),
					Member.count({
						where: { communityId: community.id },
					}),
				]);

				const host = community.domain || `${community.subdomain}.pubpub.org`;
				const protocol = isProd() ? 'https' : 'http';

				return {
					id: community.id,
					slug: community.subdomain,
					type: 'community',
					name: community.title,
					url: `${protocol}://${host}`,
					avatar: community.avatar || null,
					stats: { pubs: pubCount, members: memberCount },
					collections: [],
				};
			}),
		);

		return res.json({ accounts });
	} catch (err) {
		console.error('Summary API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── Billing usage API (placeholder) ─────────────────────────────────

router.get('/api/kf/billing/usage', requireInternalKey, async (req: any, res: any) => {
	try {
		const { kf_org_id } = req.query;
		if (!kf_org_id) {
			return res.status(400).json({ error: 'kf_org_id is required' });
		}

		const communityCount = await Community.count({
			where: { kfOrgId: kf_org_id },
		});

		// Placeholder — just return community count for now
		return res.json({
			kf_org_id,
			line_items: [{ key: 'communities', quantity: communityCount }],
		});
	} catch (err) {
		console.error('Billing usage API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── User's KF orgs (session-authenticated) ─────────────────────────

router.get('/api/kf/my-orgs', async (req: any, res: any) => {
	if (!req.user?.id) {
		return res.status(401).json({ error: 'Not authenticated' });
	}
	try {
		const orgs = await fetchUserOrgs(req.user.id);
		return res.json({ orgs });
	} catch (err) {
		console.error('Failed to fetch KF orgs:', err);
		return res.status(500).json({ error: 'Failed to fetch organizations' });
	}
});

// ─── Transfer community ownership ───────────────────────────────────

router.post('/api/kf/transfer-community', async (req: any, res: any) => {
	if (!req.user?.id) {
		return res.status(401).json({ error: 'Not authenticated' });
	}

	const { communityId, kfOrgId } = req.body;
	if (!communityId || !kfOrgId) {
		return res.status(400).json({ error: 'communityId and kfOrgId are required' });
	}

	try {
		// Verify the user is an admin of this community
		await ensureUserIsCommunityAdmin({ ...req, id: communityId });
	} catch {
		return res.status(403).json({ error: 'You must be an admin of this community' });
	}

	try {
		// Verify the user belongs to the target org
		const userOrgs = await fetchUserOrgs(req.user.id);
		const targetOrg = userOrgs.find((o) => o.id === kfOrgId);
		if (!targetOrg) {
			return res
				.status(403)
				.json({ error: 'You are not a member of the target organization' });
		}

		// Update the community's kfOrgId
		const [updatedCount] = await Community.update({ kfOrgId }, { where: { id: communityId } });

		if (updatedCount === 0) {
			return res.status(404).json({ error: 'Community not found' });
		}

		return res.json({ success: true, kfOrgId });
	} catch (err) {
		console.error('Transfer community error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── Community detail (for Hubs dashboard) ───────────────────────────

router.get('/api/kf/community/:id/detail', requireInternalKey, async (req: any, res: any) => {
	try {
		const communityId = req.params.id;
		// Optional date range params for analytics
		const startDate = req.query.startDate || null;
		const endDate = req.query.endDate || null;
		// Determine analytics date range
		const analyticsStart =
			startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		const analyticsEnd = endDate || new Date().toISOString().slice(0, 10);
		const pubsMonthsBack = startDate
			? Math.max(
					Math.ceil(
						(Date.now() - new Date(startDate).getTime()) / (30 * 24 * 60 * 60 * 1000),
					),
					3,
				) || 24
			: 24;

		const community = await Community.findByPk(communityId, {
			attributes: [
				'id',
				'title',
				'subdomain',
				'domain',
				'avatar',
				'accentColorDark',
				'accentColorLight',
				'headerLogo',
				'heroLogo',
				'description',
				'heroBackgroundImage',
				'heroImage',
			],
		});

		if (!community) {
			return res.status(404).json({ error: 'Community not found' });
		}

		const protocol = isProd() ? 'https' : 'http';
		const host = (community as any).domain || `${(community as any).subdomain}.pubpub.org`;

		// Run queries in parallel
		const hasReleaseInclude = {
			model: Release,
			as: 'releases',
			attributes: [],
			required: true,
			where: {},
		};

		const [
			pubCount,
			memberCount,
			collectionCount,
			releaseCount,
			members,
			recentPubRows,
			pubsByMonthRows,
			topAuthorsRaw,
			collectionsRaw,
		] = await Promise.all([
			Pub.count({ where: { communityId }, include: [hasReleaseInclude] }),
			Member.count({ where: { communityId } }),
			Collection.count({ where: { communityId } }),
			sequelize
				.query(
					`SELECT COUNT(*)::int AS count FROM "Releases" r INNER JOIN "Pubs" p ON r."pubId" = p.id WHERE p."communityId" = :communityId`,
					{ replacements: { communityId }, type: 'SELECT' as any },
				)
				.then((rows: any) => rows[0]?.count ?? 0),
			// Members with user details
			Member.findAll({
				where: { communityId },
				attributes: ['id', 'userId', 'permissions', 'isOwner', 'createdAt'],
				include: [
					{
						model: User,
						as: 'user',
						attributes: ['fullName', 'avatar', 'slug'],
					},
				],
				order: [['createdAt', 'ASC']],
				limit: 500,
			}),
			// Recent pubs (released only)
			Pub.findAll({
				where: { communityId },
				attributes: [
					'id',
					'title',
					'slug',
					'description',
					'avatar',
					'customPublishedAt',
					'createdAt',
				],
				include: [
					hasReleaseInclude,
					{
						model: PubAttribution,
						as: 'attributions',
						attributes: ['name', 'avatar', 'order', 'isAuthor'],
						where: { isAuthor: true },
						required: false,
						include: [
							{ model: User, as: 'user', attributes: ['fullName', 'avatar', 'slug'] },
						],
					},
				],
				order: [['createdAt', 'DESC']],
				limit: 500,
			}),
			// Pubs by month
			sequelize.query(
				`SELECT
					to_char(date_trunc('month', p."createdAt"), 'YYYY-MM') AS month,
					COUNT(*)::int AS count
				FROM "Pubs" p
				INNER JOIN "Releases" r ON r."pubId" = p.id
				WHERE p."communityId" = :communityId
					AND p."createdAt" >= :pubsCutoff
				GROUP BY 1 ORDER BY 1`,
				{
					replacements: {
						communityId,
						pubsCutoff: new Date(
							Date.now() - pubsMonthsBack * 30 * 24 * 60 * 60 * 1000,
						).toISOString(),
					},
					type: 'SELECT' as any,
				},
			),
			// Top authors
			PubAttribution.findAll({
				attributes: ['userId', 'name', 'avatar'],
				where: { isAuthor: true },
				include: [
					{
						model: Pub,
						as: 'pub',
						attributes: [],
						where: { communityId },
						required: true,
						include: [hasReleaseInclude],
					},
					{
						model: User,
						as: 'user',
						attributes: ['fullName', 'avatar', 'slug'],
						required: false,
					},
				],
			}),
			// Collections with pub counts
			sequelize.query(
				`SELECT
					c."id", c."title", c."slug", c."kind",
					COUNT(cp."pubId")::int AS "pubCount"
				FROM "Collections" c
				LEFT JOIN "CollectionPubs" cp ON cp."collectionId" = c."id"
				WHERE c."communityId" = :communityId
				GROUP BY c."id", c."title", c."slug", c."kind"
				ORDER BY "pubCount" DESC`,
				{ replacements: { communityId }, type: 'SELECT' as any },
			),
		]);

		// Format members
		const memberList = members.map((m: any) => {
			const mj = m.toJSON();
			return {
				id: mj.id,
				userId: mj.userId,
				name: mj.user?.fullName ?? 'Unknown',
				avatar: mj.user?.avatar ?? null,
				slug: mj.user?.slug ?? null,
				role: mj.isOwner ? 'owner' : (mj.permissions ?? 'view'),
				createdAt: mj.createdAt,
			};
		});

		// Format recent pubs
		const recentPubs = recentPubRows.map((p: any) => {
			const pj = p.toJSON();
			const authors = (pj.attributions || [])
				.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
				.map((attr: any) => ({
					name: attr.user?.fullName || attr.name || 'Unknown',
					avatar: attr.user?.avatar || null,
					slug: attr.user?.slug || null,
				}));
			return {
				id: pj.id,
				title: pj.title,
				slug: pj.slug,
				description: pj.description,
				avatar: pj.avatar,
				publishedAt: pj.customPublishedAt || pj.createdAt,
				authors,
			};
		});

		// Aggregate top authors
		const authorMap = new Map<
			string,
			{ name: string; avatar: string | null; slug: string | null; count: number }
		>();
		for (const attr of topAuthorsRaw) {
			const a = (attr as any).toJSON();
			const key = a.userId || `name:${a.name}`;
			const existing = authorMap.get(key);
			if (existing) {
				existing.count++;
			} else {
				authorMap.set(key, {
					name: a.user?.fullName || a.name || 'Unknown',
					avatar: a.user?.avatar || a.avatar || null,
					slug: a.user?.slug || null,
					count: 1,
				});
			}
		}
		const topAuthors = [...authorMap.values()].sort((a, b) => b.count - a.count);

		// Try to get analytics (daily views for selected range) from matview
		let dailyViews: Array<{ date: string; views: number }> = [];
		try {
			dailyViews = (await sequelize.query(
				`SELECT
					date::text,
					page_views::int AS views
				FROM analytics_daily_summary
				WHERE "communityId" = :communityId
					AND date >= :analyticsStart::date
					AND date <= :analyticsEnd::date
				ORDER BY date`,
				{
					replacements: { communityId, analyticsStart, analyticsEnd },
					type: 'SELECT' as any,
				},
			)) as any;
		} catch {
			// Matview may not exist in dev — that's fine
		}

		// Total views/downloads from the selected range
		let totalPageViews = 0;
		let totalDownloads = 0;
		try {
			const [totals] = (await sequelize.query(
				`SELECT
					COALESCE(SUM(page_views), 0)::int AS views,
					COALESCE(SUM(downloads), 0)::int AS downloads
				FROM analytics_daily_summary
				WHERE "communityId" = :communityId
					AND date >= :analyticsStart::date
					AND date <= :analyticsEnd::date`,
				{
					replacements: { communityId, analyticsStart, analyticsEnd },
					type: 'SELECT' as any,
				},
			)) as any[];
			totalPageViews = totals?.views ?? 0;
			totalDownloads = totals?.downloads ?? 0;
		} catch {
			// Matview may not exist
		}

		return res.json({
			community: {
				id: (community as any).id,
				title: (community as any).title,
				subdomain: (community as any).subdomain,
				domain: (community as any).domain,
				url: `${protocol}://${host}`,
				avatar: (community as any).avatar,
				headerLogo: (community as any).headerLogo,
				heroLogo: (community as any).heroLogo,
				description: (community as any).description,
				accentColorDark: (community as any).accentColorDark,
				accentColorLight: (community as any).accentColorLight,
				heroBackgroundImage: (community as any).heroBackgroundImage,
				heroImage: (community as any).heroImage,
			},
			stats: {
				pubs: pubCount,
				members: memberCount,
				collections: collectionCount,
				releases: releaseCount,
				totalPageViews,
				totalDownloads,
			},
			members: memberList,
			recentPubs,
			topAuthors,
			pubsByMonth: pubsByMonthRows,
			dailyViews,
			collections: (collectionsRaw as any[]).map((c: any) => ({
				id: c.id,
				title: c.title,
				slug: c.slug,
				kind: c.kind ?? 'tag',
				pubCount: c.pubCount,
			})),
		});
	} catch (err) {
		console.error('Community detail API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── Suggested Communities (domain-based discovery) ──────────────────

router.get('/api/kf/suggested-communities', requireInternalKey, async (req: any, res: any) => {
	try {
		const domainsParam = req.query.domains as string;
		const excludeIds = (req.query.excludeIds as string) || '';
		if (!domainsParam) return res.json([]);

		const domains = domainsParam
			.split(',')
			.map((d: string) => d.trim().toLowerCase())
			.filter(Boolean);
		if (domains.length === 0) return res.json([]);

		const excludeList = excludeIds.split(',').filter(Boolean);

		// Build domain match clause for User.email
		const domainClauses: string[] = [];
		const replacements: Record<string, string> = {};
		domains.forEach((d, i) => {
			domainClauses.push(
				`(LOWER(SUBSTRING("Users"."email" FROM '@(.+)$')) = :dom${i} OR LOWER(SUBSTRING("Users"."email" FROM '@(.+)$')) LIKE :domLike${i})`,
			);
			replacements[`dom${i}`] = d;
			replacements[`domLike${i}`] = `%.${d}`;
		});
		const domainWhere = domainClauses.join(' OR ');

		// Find communities with managers matching the domains
		const managersQuery = `
			SELECT "Members"."communityId", COUNT(DISTINCT "Members"."userId")::int AS "managerCount"
			FROM "Members"
			INNER JOIN "Users" ON "Users"."id" = "Members"."userId"
			WHERE "Members"."communityId" IS NOT NULL
			  AND "Members"."permissions" IN ('manage', 'admin')
			  AND (${domainWhere})
			GROUP BY "Members"."communityId"
		`;

		// Find communities with authors matching the domains
		const authorsQuery = `
			SELECT "Pubs"."communityId", COUNT(DISTINCT "PubAttributions"."userId")::int AS "authorCount"
			FROM "PubAttributions"
			INNER JOIN "Pubs" ON "Pubs"."id" = "PubAttributions"."pubId"
			INNER JOIN "Users" ON "Users"."id" = "PubAttributions"."userId"
			WHERE "PubAttributions"."isAuthor" = true
			  AND "PubAttributions"."userId" IS NOT NULL
			  AND (${domainWhere})
			GROUP BY "Pubs"."communityId"
		`;

		const [managerRows, authorRows] = await Promise.all([
			sequelize.query(managersQuery, { replacements, type: 'SELECT' as any }) as any,
			sequelize.query(authorsQuery, { replacements, type: 'SELECT' as any }) as any,
		]);

		// Merge counts
		const communityMap = new Map<string, { managerCount: number; authorCount: number }>();
		for (const row of managerRows) {
			communityMap.set(row.communityId, { managerCount: row.managerCount, authorCount: 0 });
		}
		for (const row of authorRows) {
			const existing = communityMap.get(row.communityId) || {
				managerCount: 0,
				authorCount: 0,
			};
			existing.authorCount = row.authorCount;
			communityMap.set(row.communityId, existing);
		}

		if (communityMap.size === 0) return res.json([]);

		// Exclude already-added communities
		for (const id of excludeList) communityMap.delete(id);
		if (communityMap.size === 0) return res.json([]);

		const communityIds = [...communityMap.keys()];
		const idPlaceholders = communityIds.map((_, i) => `:cid${i}`).join(', ');
		const idReplacements: Record<string, string> = {};
		communityIds.forEach((id, i) => {
			idReplacements[`cid${i}`] = id;
		});

		const communityRows = (await sequelize.query(
			`SELECT c."id", c."title", c."subdomain", c."domain", c."description", c."heroLogo", c."accentColorDark", c."accentColorLight", c."createdAt",
				(SELECT COUNT(*)::int FROM "Pubs" p INNER JOIN "Releases" r ON r."pubId" = p."id" WHERE p."communityId" = c."id") AS "pubCount"
			FROM "Communities" c
			WHERE c."id" IN (${idPlaceholders})
			ORDER BY c."title" ASC`,
			{ replacements: idReplacements, type: 'SELECT' as any },
		)) as any[];

		const results = communityRows.map((c: any) => {
			const counts = communityMap.get(c.id) || { managerCount: 0, authorCount: 0 };
			return {
				id: c.id,
				title: c.title,
				subdomain: c.subdomain,
				domain: c.domain,
				description: c.description,
				heroLogo: c.heroLogo,
				accentColorDark: c.accentColorDark,
				accentColorLight: c.accentColorLight,
				createdAt: c.createdAt,
				pubCount: c.pubCount ?? 0,
				managerCount: counts.managerCount,
				authorCount: counts.authorCount,
			};
		});

		return res.json(results);
	} catch (err) {
		console.error('Suggested communities API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── Suggested Pubs (full-text search discovery) ─────────────────────

router.get('/api/kf/suggested-pubs', requireInternalKey, async (req: any, res: any) => {
	try {
		const termsParam = req.query.terms as string;
		const excludeCommunityIds = (req.query.excludeCommunityIds as string) || '';
		const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
		if (!termsParam) return res.json([]);

		const terms = termsParam
			.split(',')
			.map((t: string) => t.trim())
			.filter(Boolean);
		if (terms.length === 0) return res.json([]);

		const excludeList = excludeCommunityIds.split(',').filter(Boolean);

		// Build tsquery from terms — use adjacency operator (<->) for exact phrase matching
		// e.g. "Mellon Foundation" → "mellon <-> foundation", single words get prefix match
		const tsQuery = terms
			.map((t) => {
				const words = t
					.trim()
					.toLowerCase()
					.replace(/[^\w\s]/g, ' ')
					.replace(/\s+/g, ' ')
					.trim()
					.split(/\s+/)
					.filter(Boolean);
				if (words.length === 0) return null;
				if (words.length === 1) return `${words[0]}:*`;
				return `(${words.join(' <-> ')})`;
			})
			.filter(Boolean)
			.join(' | ');

		if (!tsQuery) return res.json([]);

		let excludeClause = '';
		const replacements: Record<string, any> = { tsQuery, limit };
		if (excludeList.length > 0) {
			const excludePlaceholders = excludeList.map((_, i) => `:excl${i}`).join(', ');
			excludeList.forEach((id, i) => {
				replacements[`excl${i}`] = id;
			});
			excludeClause = `AND p."communityId" NOT IN (${excludePlaceholders})`;
		}

		const rows = (await sequelize.query(
			`SELECT
				p."id",
				p."title",
				p."slug",
				p."description",
				p."avatar",
				p."customPublishedAt",
				p."communityId",
				c."title" AS "communityTitle",
				c."subdomain" AS "communitySubdomain",
				c."domain" AS "communityDomain",
				ts_rank(p."searchVector", to_tsquery('english', :tsQuery)) AS "rank",
				CASE WHEN p."description" IS NOT NULL AND p."description" != ''
					THEN ts_headline('english', p."description", to_tsquery('english', :tsQuery), 'StartSel=<mark>,StopSel=</mark>,MaxWords=60,MinWords=20,MaxFragments=2,FragmentDelimiter= … ')
					ELSE NULL
				END AS "snippet",
				(
					SELECT string_agg(COALESCE(u2."fullName", pa2."name"), ', ' ORDER BY pa2."order" ASC)
					FROM "PubAttributions" pa2
					LEFT JOIN "Users" u2 ON u2."id" = pa2."userId"
					WHERE pa2."pubId" = p."id" AND pa2."isAuthor" = true
				) AS "byline"
			FROM "Pubs" p
			INNER JOIN "Communities" c ON c."id" = p."communityId"
			INNER JOIN "Releases" r ON r."pubId" = p."id"
			WHERE p."searchVector" @@ to_tsquery('english', :tsQuery)
			  ${excludeClause}
			GROUP BY p."id", c."id"
			ORDER BY "rank" DESC
			LIMIT :limit`,
			{ replacements, type: 'SELECT' as any },
		)) as any[];

		return res.json(
			rows.map((r: any) => ({
				id: r.id,
				title: r.title,
				slug: r.slug,
				description: r.description,
				avatar: r.avatar,
				communityId: r.communityId,
				communityTitle: r.communityTitle,
				communitySubdomain: r.communitySubdomain,
				communityDomain: r.communityDomain,
				byline: r.byline ?? null,
				snippet: r.snippet ?? null,
				publishedAt: r.customPublishedAt ?? null,
				rank: parseFloat(r.rank),
			})),
		);
	} catch (err) {
		console.error('Suggested pubs API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});

// ─── Graph data (cross-community people network) ────────────────────

router.get('/api/kf/graph-data', requireInternalKey, async (req: any, res: any) => {
	try {
		const communityIdsParam = req.query.communityIds as string;
		if (!communityIdsParam) return res.json({ nodes: [], links: [] });

		const communityIds = communityIdsParam.split(',').filter(Boolean);
		if (communityIds.length === 0) return res.json({ nodes: [], links: [] });

		const idPlaceholders = communityIds.map((_: string, i: number) => `:cid${i}`).join(', ');
		const replacements: Record<string, string> = {};
		communityIds.forEach((id: string, i: number) => {
			replacements[`cid${i}`] = id;
		});

		// Get communities
		const communities = (await sequelize.query(
			`SELECT "id", "title", "subdomain", "accentColorDark"
			FROM "Communities"
			WHERE "id" IN (${idPlaceholders})`,
			{ replacements, type: 'SELECT' as any },
		)) as any[];

		// Get people who appear in multiple communities (managers + authors)
		const peopleQuery = `
			SELECT
				u."id" AS "userId",
				u."fullName" AS "name",
				u."avatar",
				array_agg(DISTINCT sub."communityId") AS "communityIds",
				array_agg(DISTINCT sub."role") AS "roles"
			FROM (
				SELECT m."userId", m."communityId", 'member' AS "role"
				FROM "Members" m
				WHERE m."communityId" IN (${idPlaceholders})
				  AND m."userId" IS NOT NULL
				UNION ALL
				SELECT pa."userId", p."communityId", 'author' AS "role"
				FROM "PubAttributions" pa
				INNER JOIN "Pubs" p ON p."id" = pa."pubId"
				WHERE p."communityId" IN (${idPlaceholders})
				  AND pa."userId" IS NOT NULL
				  AND pa."isAuthor" = true
			) sub
			INNER JOIN "Users" u ON u."id" = sub."userId"
			GROUP BY u."id", u."fullName", u."avatar"
			HAVING COUNT(DISTINCT sub."communityId") >= 2
			ORDER BY COUNT(DISTINCT sub."communityId") DESC
			LIMIT 200
		`;

		const people = (await sequelize.query(peopleQuery, {
			replacements,
			type: 'SELECT' as any,
		})) as any[];

		// Build graph nodes and links
		type GraphNode = {
			id: string;
			label: string;
			type: 'community' | 'person';
			color?: string;
			avatar?: string;
		};
		type GraphLink = { source: string; target: string; roles: string[] };

		const nodes: GraphNode[] = [
			...communities.map((c: any) => ({
				id: c.id,
				label: c.title,
				type: 'community' as const,
				color: c.accentColorDark ?? '#5c7080',
			})),
			...people.map((p: any) => ({
				id: p.userId,
				label: p.name ?? 'Anonymous',
				type: 'person' as const,
				avatar: p.avatar,
			})),
		];

		const links: GraphLink[] = [];
		for (const p of people) {
			for (const cid of p.communityIds) {
				if (communityIds.includes(cid)) {
					links.push({
						source: p.userId,
						target: cid,
						roles: p.roles ?? [],
					});
				}
			}
		}

		return res.json({ nodes, links, communities: communities.length, people: people.length });
	} catch (err) {
		console.error('Graph data API error:', err);
		return res.status(500).json({ error: 'Internal error' });
	}
});
