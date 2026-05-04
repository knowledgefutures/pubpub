/**
 * Rich data queries for the Hub Data Dashboard (/hub/:slug/data).
 * Pulls pubs, authors, releases, collections across all org communities.
 */
import { col, fn, Op, QueryTypes } from 'sequelize';

import {
	Collection,
	CollectionPub,
	Community,
	Hub,
	HubCommunity,
	HubOptOut,
	HubPub,
	Member,
	Pub,
	PubAttribution,
	Release,
	SpamTag,
	User,
} from 'server/models';
import { sequelize } from 'server/sequelize';

type CommunityInfo = {
	id: string;
	subdomain: string;
	domain: string | null;
	title: string;
	description: string | null;
	accentColorDark: string | null;
	accentColorLight: string | null;
	heroLogo: string | null;
	createdAt: string;
};

export type OrgDataPayload = {
	hub: Record<string, any>;
	communities: CommunityInfo[];
	summary: {
		communityCount: number;
		pubCount: number;
		releaseCount: number;
		authorCount: number;
		collectionCount: number;
		pubsThisMonth: number;
		pubsThisYear: number;
		totalPageViews: number;
		totalDownloads: number;
	};
	recentPubs: Array<{
		id: string;
		title: string;
		slug: string;
		description: string | null;
		avatar: string | null;
		customPublishedAt: string | null;
		createdAt: string;
		communityTitle: string;
		communitySubdomain: string;
		communityDomain: string | null;
		communityId: string;
		authors: Array<{ name: string; avatar: string | null; slug: string | null }>;
		sparkline: Array<{ date: string; views: number }>;
	}>;
	topAuthors: Array<{
		name: string;
		avatar: string | null;
		slug: string | null;
		orcid: string | null;
		pubCount: number;
		communities: string[];
		communityIds: string[];
	}>;
	communityStats: Array<{
		id: string;
		title: string;
		subdomain: string;
		domain: string | null;
		accentColorDark: string | null;
		pubCount: number;
		releaseCount: number;
		authorCount: number;
		collectionCount: number;
		recentPubCount: number;
		oldestPub: string | null;
		newestPub: string | null;
		pageViews: number;
		downloads: number;
		dataAccess: 'none' | 'requested' | 'granted';
		sparkline: Array<{ date: string; views: number }>;
		managers: Array<{ name: string; avatar: string | null; slug: string | null }>;
	}>;
	pubsByMonth: Array<{ month: string; count: number }>;
	dailyViews: Array<{ date: string; views: number }>;
	analyticsScope: {
		grantedCount: number;
		totalCount: number;
		grantedNames: string[];
	};
	topCollections: Array<{
		id: string;
		title: string;
		kind: string;
		communityTitle: string;
		pubCount: number;
	}>;
	grantableCommunityIds: string[];
	grantablePubIds: string[];
};

export const getHubDataDashboard = async (
	slug: string,
	opts?: { startDate?: string; endDate?: string; userId?: string | null },
): Promise<OrgDataPayload | null> => {
	const org = await Hub.findOne({ where: { slug } });
	if (!org) return null;

	// Get all community IDs + dataAccess from join table
	const associations = await HubCommunity.findAll({
		where: { hubId: org.id },
		attributes: ['dataAccess'],
		include: [
			{
				model: Community,
				attributes: [
					'id',
					'subdomain',
					'domain',
					'title',
					'description',
					'accentColorDark',
					'accentColorLight',
					'heroLogo',
					'createdAt',
				],
				include: [
					{
						model: SpamTag,
						as: 'spamTag',
						attributes: ['status'],
						required: false,
					},
				],
			},
		],
	});

	const allCommunities = associations.map((a) => (a as any).community).filter(Boolean);

	// Filter out spam communities
	const isSpam = (c: any) => c.spamTag?.status === 'confirmed';

	// Build a map of communityId -> dataAccess from the join table
	const dataAccessMap = new Map<string, string>();
	for (const a of associations) {
		const aj = a as any;
		if (aj.community) {
			dataAccessMap.set(aj.community.id, aj.dataAccess || 'none');
		}
	}

	// Filter out communities that have opted out of curation by this org
	const optOuts = await HubOptOut.findAll({
		where: { hubId: org.id },
		attributes: ['communityId'],
	});
	const rejectedCommunityIds = new Set(optOuts.map((o: any) => o.communityId));

	const communities: CommunityInfo[] = allCommunities
		.filter((c: any) => !rejectedCommunityIds.has(c.id) && !isSpam(c))
		.map((c: any) => c.toJSON());

	const communityIds = communities.map((c) => c.id);
	if (communityIds.length === 0) {
		return {
			hub: org.toJSON(),
			communities: [],
			summary: {
				communityCount: 0,
				pubCount: 0,
				releaseCount: 0,
				authorCount: 0,
				collectionCount: 0,
				pubsThisMonth: 0,
				pubsThisYear: 0,
				totalPageViews: 0,
				totalDownloads: 0,
			},
			recentPubs: [],
			topAuthors: [],
			communityStats: [],
			pubsByMonth: [],
			dailyViews: [],
			analyticsScope: { grantedCount: 0, totalCount: 0, grantedNames: [] },
			topCollections: [],
			grantableCommunityIds: [],
			grantablePubIds: [],
		};
	}

	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfYear = new Date(now.getFullYear(), 0, 1);

	// Get all released pub IDs
	const hasReleaseInclude = {
		model: Release,
		attributes: [],
		required: true,
		where: {},
	};
	const allPubIds = (
		await Pub.findAll({
			where: { communityId: communityIds },
			attributes: ['id'],
			include: [hasReleaseInclude],
			raw: true,
		})
	).map((p: any) => p.id);

	// ── Aggregate counts ──
	const [pubCount, releaseCount, collectionCount, pubsThisMonth, pubsThisYear] =
		await Promise.all([
			Promise.resolve(allPubIds.length),
			allPubIds.length > 0
				? Release.count({ where: { pubId: allPubIds } })
				: Promise.resolve(0),
			Collection.count({ where: { communityId: communityIds } }),
			Pub.count({
				where: { communityId: communityIds, createdAt: { [Op.gte]: startOfMonth } },
				include: [hasReleaseInclude],
			}),
			Pub.count({
				where: { communityId: communityIds, createdAt: { [Op.gte]: startOfYear } },
				include: [hasReleaseInclude],
			}),
		]);

	// Unique author count (released pubs only)
	const allAttributions = await PubAttribution.findAll({
		attributes: ['userId', 'name'],
		include: [
			{
				model: Pub,
				attributes: [],
				where: { communityId: communityIds },
				required: true,
				include: [hasReleaseInclude],
			},
		],
		where: { isAuthor: true },
	});
	const uniqueAuthorKeys = new Set<string>();
	for (const attr of allAttributions) {
		const a = attr.toJSON() as any;
		uniqueAuthorKeys.add(a.userId || `name:${a.name}`);
	}
	const authorCount = uniqueAuthorKeys.size;

	// ── Pubs (all released, capped at 2000) ──
	const recentPubRows = await Pub.findAll({
		where: { communityId: communityIds },
		attributes: [
			'id',
			'title',
			'slug',
			'description',
			'avatar',
			'customPublishedAt',
			'createdAt',
			'communityId',
		],
		order: [['createdAt', 'DESC']],
		limit: 2000,
		include: [
			hasReleaseInclude,
			{
				model: Community,
				attributes: ['title', 'subdomain', 'domain'],
			},
			{
				model: PubAttribution,
				as: 'attributions',
				attributes: ['name', 'avatar', 'order', 'isAuthor'],
				where: { isAuthor: true },
				required: false,
				include: [
					{
						model: User,
						attributes: ['fullName', 'avatar', 'slug'],
					},
				],
			},
		],
	});

	const recentPubs = recentPubRows.map((p) => {
		const pj = p.toJSON() as any;
		const authors = (pj.attributions || [])
			.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
			.map((attr: any) => ({
				name: attr.user?.fullName || attr.name || 'Unknown',
				avatar: attr.user?.avatar || attr.avatar || null,
				slug: attr.user?.slug || null,
			}));
		return {
			id: pj.id,
			title: pj.title,
			slug: pj.slug,
			description: pj.description,
			avatar: pj.avatar,
			customPublishedAt: pj.customPublishedAt,
			createdAt: pj.createdAt,
			communityTitle: pj.community?.title || '',
			communitySubdomain: pj.community?.subdomain || '',
			communityDomain: pj.community?.domain || null,
			communityId: pj.communityId,
			authors,
			sparkline: [] as Array<{ date: string; views: number }>,
		};
	});

	// ── Top authors (by released pub count) ──
	const authorAttributions = await PubAttribution.findAll({
		attributes: ['userId', 'name', 'avatar', 'orcid', 'pubId'],
		where: { isAuthor: true },
		include: [
			{
				model: Pub,
				attributes: ['communityId'],
				where: { communityId: communityIds },
				required: true,
				include: [hasReleaseInclude],
			},
			{
				model: User,
				attributes: ['fullName', 'avatar', 'slug', 'orcid'],
				required: false,
			},
		],
	});

	const authorMap = new Map<
		string,
		{
			name: string;
			avatar: string | null;
			slug: string | null;
			orcid: string | null;
			pubIds: Set<string>;
			communityIds: Set<string>;
		}
	>();
	for (const attr of authorAttributions) {
		const a = attr.toJSON() as any;
		const key = a.userId || `name:${a.name}`;
		if (!authorMap.has(key)) {
			authorMap.set(key, {
				name: a.user?.fullName || a.name || 'Unknown',
				avatar: a.user?.avatar || a.avatar || null,
				slug: a.user?.slug || null,
				orcid: a.user?.orcid || a.orcid || null,
				pubIds: new Set(),
				communityIds: new Set(),
			});
		}
		const entry = authorMap.get(key)!;
		entry.pubIds.add(a.pubId);
		if (a.pub?.communityId) entry.communityIds.add(a.pub.communityId);
	}

	const communityIdToTitle = new Map(communities.map((c) => [c.id, c.title]));
	const topAuthors = [...authorMap.values()]
		.map((a) => ({
			name: a.name,
			avatar: a.avatar,
			slug: a.slug,
			orcid: a.orcid,
			pubCount: a.pubIds.size,
			communities: [...a.communityIds].map((cid) => communityIdToTitle.get(cid) || cid),
			communityIds: [...a.communityIds],
		}))
		.sort((a, b) => b.pubCount - a.pubCount)
		.slice(0, 500);

	// ── Per-community stats ──
	const communityStats = await Promise.all(
		communities.map(async (c) => {
			const cPubIds = (
				await Pub.findAll({
					where: { communityId: c.id },
					attributes: ['id'],
					include: [hasReleaseInclude],
					raw: true,
				})
			).map((p: any) => p.id);

			const [cPubCount, cReleaseCount, cCollectionCount, cRecentPubCount] = await Promise.all(
				[
					Promise.resolve(cPubIds.length),
					cPubIds.length > 0
						? Release.count({ where: { pubId: cPubIds } })
						: Promise.resolve(0),
					Collection.count({ where: { communityId: c.id } }),
					Pub.count({
						where: { communityId: c.id, createdAt: { [Op.gte]: startOfMonth } },
						include: [hasReleaseInclude],
					}),
				],
			);

			// Unique authors in this community
			const cAttrs = await PubAttribution.findAll({
				attributes: ['userId', 'name'],
				where: { isAuthor: true },
				include: [
					{
						model: Pub,
						attributes: [],
						where: { communityId: c.id },
						required: true,
						include: [hasReleaseInclude],
					},
				],
			});
			const cAuthorKeys = new Set<string>();
			for (const ca of cAttrs) {
				const caj = ca.toJSON() as any;
				cAuthorKeys.add(caj.userId || `name:${caj.name}`);
			}

			const oldest = await Pub.findOne({
				where: { communityId: c.id },
				attributes: ['createdAt'],
				include: [hasReleaseInclude],
				order: [['createdAt', 'ASC']],
			});
			const newest = await Pub.findOne({
				where: { communityId: c.id },
				attributes: ['createdAt'],
				include: [hasReleaseInclude],
				order: [['createdAt', 'DESC']],
			});

			return {
				id: c.id,
				title: c.title,
				subdomain: c.subdomain,
				domain: c.domain,
				accentColorDark: c.accentColorDark,
				pubCount: cPubCount,
				releaseCount: cReleaseCount,
				authorCount: cAuthorKeys.size,
				collectionCount: cCollectionCount,
				recentPubCount: cRecentPubCount,
				oldestPub: oldest ? (oldest as any).createdAt : null,
				newestPub: newest ? (newest as any).createdAt : null,
			};
		}),
	);

	// ── Pubs by month (respects selected date range) ──
	const pubRangeEnd = opts?.endDate || now.toISOString().slice(0, 10);
	const pubRangeStart =
		opts?.startDate ||
		(() => {
			const d = new Date(now);
			d.setDate(d.getDate() - 365);
			return d.toISOString().slice(0, 10);
		})();
	const pubsByMonthRaw = await Pub.findAll({
		attributes: [
			[fn('to_char', col('Pub.createdAt'), 'YYYY-MM'), 'month'],
			[fn('COUNT', col('Pub.id')), 'count'],
		],
		where: {
			communityId: communityIds,
			createdAt: {
				[Op.gte]: new Date(pubRangeStart),
				[Op.lte]: new Date(pubRangeEnd + 'T23:59:59.999Z'),
			},
		},
		include: [hasReleaseInclude],
		group: [fn('to_char', col('Pub.createdAt'), 'YYYY-MM')],
		order: [[fn('to_char', col('Pub.createdAt'), 'YYYY-MM'), 'ASC']],
		raw: true,
	} as any);
	const pubCountByMonth = new Map(
		(pubsByMonthRaw as any[]).map((r) => [r.month, parseInt(r.count, 10)]),
	);
	// Build full month sequence with zeros for months without pubs
	const pubsByMonth: Array<{ month: string; count: number }> = [];
	{
		const start = new Date(pubRangeStart + 'T00:00:00Z');
		const end = new Date(pubRangeEnd + 'T00:00:00Z');
		const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
		const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
		while (cursor <= endMonth) {
			const key = cursor.toISOString().slice(0, 7); // YYYY-MM
			pubsByMonth.push({ month: key, count: pubCountByMonth.get(key) || 0 });
			cursor.setUTCMonth(cursor.getUTCMonth() + 1);
		}
	}

	// ── Top collections ──
	const topCollectionsRaw = await Collection.findAll({
		where: { communityId: communityIds },
		attributes: ['id', 'title', 'kind'],
		include: [
			{ model: Community, attributes: ['title'] },
			{ model: CollectionPub, as: 'collectionPubs', attributes: ['id'] },
		],
	});
	const topCollections = topCollectionsRaw
		.map((c) => {
			const cj = c.toJSON() as any;
			return {
				id: cj.id,
				title: cj.title,
				kind: cj.kind,
				communityTitle: cj.community?.title || '',
				pubCount: (cj.collectionPubs || []).length,
			};
		})
		.sort((a, b) => b.pubCount - a.pubCount)
		.slice(0, 30);

	// ── Analytics from materialized views ──
	// Only query analytics for communities with dataAccess === 'granted'
	const analyticsGrantedIds = communityIds.filter((id) => dataAccessMap.get(id) === 'granted');
	const grantedNames = communities
		.filter((c) => analyticsGrantedIds.includes(c.id))
		.map((c) => c.title);

	// Time range for analytics
	const endDate = opts?.endDate || now.toISOString().slice(0, 10);
	const startDate =
		opts?.startDate ||
		(() => {
			const d = new Date(now);
			d.setDate(d.getDate() - 365);
			return d.toISOString().slice(0, 10);
		})();
	// For sparklines, always use 90 days regardless of main range
	const sparklineStart = (() => {
		const d = new Date(now);
		d.setDate(d.getDate() - 90);
		return d.toISOString().slice(0, 10);
	})();

	let totalPageViews = 0;
	let totalDownloads = 0;
	let dailyViews: Array<{ date: string; views: number }> = [];
	const communityPageViews = new Map<string, number>();
	const communityDownloads = new Map<string, number>();
	const communitySparklines = new Map<string, Array<{ date: string; views: number }>>();

	if (analyticsGrantedIds.length > 0) {
		try {
			// All-time page views and downloads (for scalar cards)
			const [totals] = await sequelize.query<{
				page_views: string;
				downloads: string;
			}>(
				`SELECT
					COALESCE(SUM(page_views), 0)::bigint AS page_views,
					COALESCE(SUM(downloads), 0)::bigint AS downloads
				FROM analytics_daily_summary
				WHERE "communityId" IN (:communityIds)
					AND date >= (CURRENT_DATE - INTERVAL '2 years')`,
				{
					replacements: {
						communityIds: analyticsGrantedIds,
					},
					type: QueryTypes.SELECT,
				},
			);
			if (totals) {
				totalPageViews = parseInt(String(totals.page_views), 10) || 0;
				totalDownloads = parseInt(String(totals.downloads), 10) || 0;
			}

			// Daily views (within selected range) for area chart
			const dailyRows = await sequelize.query<{ date: string; views: string }>(
				`SELECT
					date::text,
					SUM(page_views)::int AS views
				FROM analytics_daily_summary
				WHERE "communityId" IN (:communityIds)
					AND date >= :startDate::date
					AND date <= :endDate::date
				GROUP BY date
				ORDER BY date`,
				{
					replacements: {
						communityIds: analyticsGrantedIds,
						startDate,
						endDate,
					},
					type: QueryTypes.SELECT,
				},
			);
			dailyViews = dailyRows.map((r) => ({
				date: r.date,
				views: parseInt(String(r.views), 10) || 0,
			}));

			// Per-community totals (within selected range)
			const perCommunityRows = await sequelize.query<{
				communityId: string;
				page_views: string;
				downloads: string;
			}>(
				`SELECT
					"communityId",
					SUM(page_views)::bigint AS page_views,
					SUM(downloads)::bigint AS downloads
				FROM analytics_daily_summary
				WHERE "communityId" IN (:communityIds)
					AND date >= :startDate::date
					AND date <= :endDate::date
				GROUP BY "communityId"`,
				{
					replacements: {
						communityIds: analyticsGrantedIds,
						startDate,
						endDate,
					},
					type: QueryTypes.SELECT,
				},
			);
			for (const r of perCommunityRows) {
				communityPageViews.set(r.communityId, parseInt(String(r.page_views), 10) || 0);
				communityDownloads.set(r.communityId, parseInt(String(r.downloads), 10) || 0);
			}

			// Per-community sparklines (90 days, for table rows)
			const sparklineRows = await sequelize.query<{
				communityId: string;
				date: string;
				views: string;
			}>(
				`SELECT
					"communityId",
					date::text,
					SUM(page_views)::int AS views
				FROM analytics_daily_summary
				WHERE "communityId" IN (:communityIds)
					AND date >= :sparklineStart::date
				GROUP BY "communityId", date
				ORDER BY "communityId", date`,
				{
					replacements: {
						communityIds: analyticsGrantedIds,
						sparklineStart,
					},
					type: QueryTypes.SELECT,
				},
			);
			for (const r of sparklineRows) {
				if (!communitySparklines.has(r.communityId)) {
					communitySparklines.set(r.communityId, []);
				}
				communitySparklines.get(r.communityId)!.push({
					date: r.date,
					views: parseInt(String(r.views), 10) || 0,
				});
			}

			// Per-pub sparklines (90 days, for publications table)
			const pubIds = recentPubs
				.filter((p) => analyticsGrantedIds.includes(p.communityId))
				.map((p) => p.id);
			if (pubIds.length > 0) {
				const pubSparklineRows = await sequelize.query<{
					pubId: string;
					date: string;
					views: string;
				}>(
					`SELECT
						"pubId",
						date::text,
						SUM(views)::int AS views
					FROM analytics_daily_pub
					WHERE "pubId" IN (:pubIds)
						AND date >= :sparklineStart::date
					GROUP BY "pubId", date
					ORDER BY "pubId", date`,
					{
						replacements: { pubIds, sparklineStart },
						type: QueryTypes.SELECT,
					},
				);
				const pubSparkMap = new Map<string, Array<{ date: string; views: number }>>();
				for (const r of pubSparklineRows) {
					if (!pubSparkMap.has(r.pubId)) {
						pubSparkMap.set(r.pubId, []);
					}
					pubSparkMap.get(r.pubId)!.push({
						date: r.date,
						views: parseInt(String(r.views), 10) || 0,
					});
				}
				for (const p of recentPubs) {
					p.sparkline = pubSparkMap.get(p.id) || [];
				}
			}
		} catch {
			// Analytics matviews may not exist yet — non-fatal
		}
	}

	// ── Community managers (for communities with dataAccess granted) ──
	const communityManagers = new Map<
		string,
		Array<{ name: string; avatar: string | null; slug: string | null }>
	>();
	if (analyticsGrantedIds.length > 0) {
		try {
			const members = await Member.findAll({
				where: {
					communityId: analyticsGrantedIds,
					permissions: ['manage', 'admin'],
				},
				include: [
					{
						model: User,
						as: 'user',
						attributes: ['fullName', 'avatar', 'slug'],
					},
				],
			});
			for (const m of members) {
				const mj = m.toJSON() as any;
				const cid = mj.communityId;
				const u = mj.user;
				if (!u || !cid) continue;
				if (!communityManagers.has(cid)) communityManagers.set(cid, []);
				communityManagers.get(cid)!.push({
					name: u.fullName,
					avatar: u.avatar,
					slug: u.slug,
				});
			}
		} catch {
			// non-fatal
		}
	}

	// Merge analytics into communityStats
	const communityStatsWithViews = communityStats.map((cs) => ({
		...cs,
		pageViews: communityPageViews.get(cs.id) || 0,
		downloads: communityDownloads.get(cs.id) || 0,
		dataAccess: (dataAccessMap.get(cs.id) || 'none') as 'none' | 'requested' | 'granted',
		sparkline: communitySparklines.get(cs.id) || [],
		managers: communityManagers.get(cs.id) || [],
	}));

	// ── Grantable community IDs (communities the current user can grant data access to) ──
	let grantableCommunityIds: string[] = [];
	let grantablePubIds: string[] = [];
	const userId = opts?.userId;
	if (userId) {
		try {
			const adminMemberships = await Member.findAll({
				where: {
					userId,
					communityId: communityIds,
					permissions: 'admin',
				},
				attributes: ['communityId'],
				raw: true,
			});
			grantableCommunityIds = adminMemberships.map((m: any) => m.communityId);
		} catch {
			// non-fatal
		}

		// Grantable pub IDs: pubs the user can directly grant data access to
		try {
			const hubPubs = await HubPub.findAll({
				where: { hubId: org.id },
				attributes: ['pubId'],
				raw: true,
			});
			const curatedPubIds = hubPubs.map((hp: any) => hp.pubId);
			if (curatedPubIds.length > 0) {
				// Pubs where user is manage/admin member
				const pubMemberships = await Member.findAll({
					where: {
						userId,
						pubId: curatedPubIds,
						permissions: ['manage', 'admin'],
					},
					attributes: ['pubId'],
					raw: true,
				});
				const directGrantable = new Set(pubMemberships.map((m: any) => m.pubId));

				// Pubs in communities where user is admin
				const adminCommunitySet = new Set(grantableCommunityIds);
				const pubsInAdminCommunities = await Pub.findAll({
					where: {
						id: curatedPubIds,
						communityId: [...adminCommunitySet],
					},
					attributes: ['id'],
					raw: true,
				});
				for (const p of pubsInAdminCommunities) {
					directGrantable.add((p as any).id);
				}

				grantablePubIds = [...directGrantable];
			}
		} catch {
			// non-fatal
		}
	}

	return {
		hub: org.toJSON(),
		communities,
		summary: {
			communityCount: communities.length,
			pubCount,
			releaseCount,
			authorCount,
			collectionCount,
			pubsThisMonth,
			pubsThisYear,
			totalPageViews,
			totalDownloads,
		},
		recentPubs,
		topAuthors,
		communityStats: communityStatsWithViews.sort((a, b) => b.pubCount - a.pubCount),
		pubsByMonth,
		dailyViews,
		analyticsScope: {
			grantedCount: analyticsGrantedIds.length,
			totalCount: communityIds.length,
			grantedNames,
		},
		topCollections,
		grantableCommunityIds,
		grantablePubIds,
	};
};
