import { Router } from 'express';
import { QueryTypes } from 'sequelize';

import { sequelize } from 'server/sequelize';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';

export const router = Router();

// ── In-memory cache (1 hour TTL) ────────────────────────────────────
const CACHE_TTL_MS = 60 * 60 * 1000;
let cachedResult: { data: any; expiresAt: number } | null = null;

// ── Spam SQL fragments ──────────────────────────────────────────────
// "confirmed-spam" via spamTagId on Communities / Users directly.
const SPAM_TAG_IDS = `(SELECT id FROM "SpamTags" WHERE status = 'confirmed-spam')`;
const SPAM_COMMUNITY_IDS = `(SELECT id FROM "Communities" WHERE "spamTagId" IN ${SPAM_TAG_IDS})`;

const IS_SPAM_COMMUNITY = `"spamTagId" IN ${SPAM_TAG_IDS}`;
const NOT_SPAM_COMMUNITY = `("spamTagId" IS NULL OR "spamTagId" NOT IN ${SPAM_TAG_IDS})`;
const IS_SPAM_USER = `"spamTagId" IN ${SPAM_TAG_IDS}`;
const NOT_SPAM_USER = `("spamTagId" IS NULL OR "spamTagId" NOT IN ${SPAM_TAG_IDS})`;
const IS_SPAM_VIA_COMMUNITY = `"communityId" IN ${SPAM_COMMUNITY_IDS}`;
const NOT_SPAM_VIA_COMMUNITY = `"communityId" NOT IN ${SPAM_COMMUNITY_IDS}`;

async function fetchAnalytics() {
	const [
		communityTotals,
		userTotals,
		pubTotals,
		pageviewTotals,
		communitiesByMonth,
		usersByMonth,
		pubsByMonth,
		pageviewsByMonth,
		activeCommunityTrendActivity,
		activeCommunityTrendPubs,
	] = await Promise.all([
		// ── Total counts (clean + spam in one query each) ───────────────
		sequelize.query<{ clean: string; spam: string }>(
			`SELECT COUNT(*) FILTER (WHERE ${NOT_SPAM_COMMUNITY}) AS clean,
			        COUNT(*) FILTER (WHERE ${IS_SPAM_COMMUNITY}) AS spam
			 FROM "Communities"`,
			{ type: QueryTypes.SELECT },
		),
		sequelize.query<{ clean: string; spam: string }>(
			`SELECT COUNT(*) FILTER (WHERE ${NOT_SPAM_USER}) AS clean,
			        COUNT(*) FILTER (WHERE ${IS_SPAM_USER}) AS spam
			 FROM "Users"`,
			{ type: QueryTypes.SELECT },
		),
		sequelize.query<{ clean: string; spam: string }>(
			`SELECT COUNT(*) FILTER (WHERE ${NOT_SPAM_VIA_COMMUNITY}) AS clean,
			        COUNT(*) FILTER (WHERE ${IS_SPAM_VIA_COMMUNITY}) AS spam
			 FROM "Pubs"`,
			{ type: QueryTypes.SELECT },
		),
		sequelize.query<{ clean: string; spam: string }>(
			`SELECT COALESCE(SUM(page_views) FILTER (WHERE ${NOT_SPAM_VIA_COMMUNITY}), 0)::bigint AS clean,
			        COALESCE(SUM(page_views) FILTER (WHERE ${IS_SPAM_VIA_COMMUNITY}), 0)::bigint AS spam
			 FROM analytics_daily_summary`,
			{ type: QueryTypes.SELECT },
		),
		// ── Monthly series (clean + spam per month) ─────────────────────
		sequelize.query<{ month: string; clean: string; spam: string }>(
			`SELECT DATE_TRUNC('month', "createdAt") AS month,
			        COUNT(*) FILTER (WHERE ${NOT_SPAM_COMMUNITY}) AS clean,
			        COUNT(*) FILTER (WHERE ${IS_SPAM_COMMUNITY}) AS spam
			 FROM "Communities"
			 GROUP BY month ORDER BY month`,
			{ type: QueryTypes.SELECT },
		),
		sequelize.query<{ month: string; clean: string; spam: string }>(
			`SELECT DATE_TRUNC('month', "createdAt") AS month,
			        COUNT(*) FILTER (WHERE ${NOT_SPAM_USER}) AS clean,
			        COUNT(*) FILTER (WHERE ${IS_SPAM_USER}) AS spam
			 FROM "Users"
			 GROUP BY month ORDER BY month`,
			{ type: QueryTypes.SELECT },
		),
		sequelize.query<{ month: string; clean: string; spam: string }>(
			`SELECT DATE_TRUNC('month', "createdAt") AS month,
			        COUNT(*) FILTER (WHERE ${NOT_SPAM_VIA_COMMUNITY}) AS clean,
			        COUNT(*) FILTER (WHERE ${IS_SPAM_VIA_COMMUNITY}) AS spam
			 FROM "Pubs"
			 GROUP BY month ORDER BY month`,
			{ type: QueryTypes.SELECT },
		),
		sequelize.query<{ month: string; clean: string; spam: string }>(
			`SELECT DATE_TRUNC('month', date) AS month,
			        COALESCE(SUM(page_views) FILTER (WHERE ${NOT_SPAM_VIA_COMMUNITY}), 0)::bigint AS clean,
			        COALESCE(SUM(page_views) FILTER (WHERE ${IS_SPAM_VIA_COMMUNITY}), 0)::bigint AS spam
			 FROM analytics_daily_summary
			 GROUP BY month ORDER BY month`,
			{ type: QueryTypes.SELECT },
		),
		// ── Active communities (clean only — spam overlay not meaningful) ─
		sequelize.query<{ month: string; count: string }>(
			`SELECT DATE_TRUNC('month', "timestamp") AS month,
			        COUNT(DISTINCT "communityId") AS count
			 FROM "ActivityItems" WHERE ${NOT_SPAM_VIA_COMMUNITY}
			 GROUP BY month ORDER BY month`,
			{ type: QueryTypes.SELECT },
		),
		sequelize.query<{ month: string; count: string }>(
			`SELECT DATE_TRUNC('month', "createdAt") AS month,
			        COUNT(DISTINCT "communityId") AS count
			 FROM "Pubs" WHERE ${NOT_SPAM_VIA_COMMUNITY}
			 GROUP BY month ORDER BY month`,
			{ type: QueryTypes.SELECT },
		),
	]);

	const toSeries = (rows: { month: string; clean: string; spam: string }[]) =>
		rows.map((r) => ({ month: r.month, count: Number(r.clean), spam: Number(r.spam) }));
	const toSimpleSeries = (rows: { month: string; count: string }[]) =>
		rows.map((r) => ({ month: r.month, count: Number(r.count) }));

	return {
		totals: {
			communities: Number(communityTotals[0].clean),
			users: Number(userTotals[0].clean),
			pubs: Number(pubTotals[0].clean),
			pageviews: Number(pageviewTotals[0]?.clean ?? 0),
		},
		spam: {
			communities: Number(communityTotals[0].spam),
			users: Number(userTotals[0].spam),
			pubs: Number(pubTotals[0].spam),
			pageviews: Number(pageviewTotals[0]?.spam ?? 0),
		},
		communitiesByMonth: toSeries(communitiesByMonth),
		usersByMonth: toSeries(usersByMonth),
		pubsByMonth: toSeries(pubsByMonth),
		pageviewsByMonth: toSeries(pageviewsByMonth),
		activeCommunityTrendActivity: toSimpleSeries(activeCommunityTrendActivity),
		activeCommunityTrendPubs: toSimpleSeries(activeCommunityTrendPubs),
	};
}

router.get('/api/platformAnalytics', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const now = Date.now();
		if (cachedResult && cachedResult.expiresAt > now) {
			return res.json(cachedResult.data);
		}

		const data = await fetchAnalytics();
		cachedResult = { data, expiresAt: now + CACHE_TTL_MS };
		return res.json(data);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

// ── Period drill-down (date-range filtered counts + paginated communities) ──

const PERIOD_PAGE_SIZE = 25;

router.get('/api/platformAnalytics/period', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const startDate = String(req.query.startDate ?? '');
		const endDate = String(req.query.endDate ?? '');
		if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
			return res
				.status(400)
				.json({ error: 'startDate and endDate are required (YYYY-MM-DD)' });
		}

		const page = Math.max(0, parseInt(String(req.query.page ?? '0'), 10) || 0);
		const offset = page * PERIOD_PAGE_SIZE;

		const dateRange = `"createdAt" >= :startDate::date AND "createdAt" < :endDate::date + INTERVAL '1 day'`;
		const pvDateRange = `date >= :startDate::date AND date <= :endDate::date`;

		const [communities, users, pubs, pageviews, newCommunitiesRows, totalNewCommunities] =
			await Promise.all([
				sequelize.query<{ clean: string; spam: string }>(
					`SELECT COUNT(*) FILTER (WHERE ${NOT_SPAM_COMMUNITY}) AS clean,
					        COUNT(*) FILTER (WHERE ${IS_SPAM_COMMUNITY}) AS spam
					 FROM "Communities" WHERE ${dateRange}`,
					{ type: QueryTypes.SELECT, replacements: { startDate, endDate } },
				),
				sequelize.query<{ clean: string; spam: string }>(
					`SELECT COUNT(*) FILTER (WHERE ${NOT_SPAM_USER}) AS clean,
					        COUNT(*) FILTER (WHERE ${IS_SPAM_USER}) AS spam
					 FROM "Users" WHERE ${dateRange}`,
					{ type: QueryTypes.SELECT, replacements: { startDate, endDate } },
				),
				sequelize.query<{ clean: string; spam: string }>(
					`SELECT COUNT(*) FILTER (WHERE ${NOT_SPAM_VIA_COMMUNITY}) AS clean,
					        COUNT(*) FILTER (WHERE ${IS_SPAM_VIA_COMMUNITY}) AS spam
					 FROM "Pubs" WHERE ${dateRange}`,
					{ type: QueryTypes.SELECT, replacements: { startDate, endDate } },
				),
				sequelize.query<{ clean: string; spam: string }>(
					`SELECT COALESCE(SUM(page_views) FILTER (WHERE ${NOT_SPAM_VIA_COMMUNITY}), 0)::bigint AS clean,
					        COALESCE(SUM(page_views) FILTER (WHERE ${IS_SPAM_VIA_COMMUNITY}), 0)::bigint AS spam
					 FROM analytics_daily_summary WHERE ${pvDateRange}`,
					{ type: QueryTypes.SELECT, replacements: { startDate, endDate } },
				),
				sequelize.query<{
					title: string;
					subdomain: string;
					createdAt: string;
					description: string;
					isSpam: boolean;
				}>(
					`SELECT "title", "subdomain", "createdAt",
					        COALESCE("description", '') AS description,
					        (${IS_SPAM_COMMUNITY}) AS "isSpam"
					 FROM "Communities"
					 WHERE ${dateRange}
					 ORDER BY "createdAt" DESC
					 LIMIT :limit OFFSET :offset`,
					{
						type: QueryTypes.SELECT,
						replacements: { startDate, endDate, limit: PERIOD_PAGE_SIZE, offset },
					},
				),
				sequelize.query<{ count: string }>(
					`SELECT COUNT(*) AS count FROM "Communities" WHERE ${dateRange}`,
					{ type: QueryTypes.SELECT, replacements: { startDate, endDate } },
				),
			]);

		return res.json({
			counts: {
				communities: Number(communities[0].clean),
				users: Number(users[0].clean),
				pubs: Number(pubs[0].clean),
				pageviews: Number(pageviews[0]?.clean ?? 0),
			},
			spam: {
				communities: Number(communities[0].spam),
				users: Number(users[0].spam),
				pubs: Number(pubs[0].spam),
				pageviews: Number(pageviews[0]?.spam ?? 0),
			},
			newCommunities: newCommunitiesRows,
			totalNewCommunities: Number(totalNewCommunities[0].count),
			page,
			pageSize: PERIOD_PAGE_SIZE,
		});
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
