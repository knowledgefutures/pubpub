import type * as types from 'types';
import type { DocJson, Maybe } from 'types';

import { isUserAffiliatedWithAnyCommunity } from 'server/community/queries';
import { type SpamTag, ThreadComment, type User } from 'server/models';

import { extractLinksFromContent, extractUrlsFromString } from './commentSpam';
import { containsLink, matchesCommentSpamTemplate } from './contentAnalysis';
import { communitySpamPhrases } from './phrases';
import { getRecentDiscussionsForUserRaw } from './userDashboard';
import { getLegitimateAffiliationsForUser } from './userQueries';

const CURRENT_SPAM_SCORE_VERSION = 3;

type SpamField<T> = {
	extract: (value: T) => Maybe<string>;
	isProse: boolean;
	weight: number;
};

const profileSpamFields: Record<string, SpamField<User>> = {
	fullName: { extract: (u) => u.fullName, isProse: true, weight: 1 },
	bio: { extract: (u) => u.bio, isProse: true, weight: 1 },
};

const getMatchingSpamPhrases = (text: string, isProse: boolean): string[] => {
	if (!text) return [];

	return communitySpamPhrases.filter((phrase) => {
		const lower = text.toLowerCase();
		const lowerPhrase = phrase.toLowerCase();

		if (isProse) {
			return lower.includes(' ' + lowerPhrase) || lower.includes(lowerPhrase + ' ');
		}

		return lower.includes(lowerPhrase);
	});
};

const getProfilePhraseScore = (user: User) => {
	return Object.keys(profileSpamFields).reduce(
		(report, key) => {
			const { extract, weight, isProse } = profileSpamFields[key];
			const text = extract(user);
			if (!text) return report;

			const matches = getMatchingSpamPhrases(text, isProse);
			if (matches.length === 0) return report;

			return {
				score: report.score + weight * matches.length,
				fields: { ...report.fields, [key]: matches },
			};
		},
		{ score: 0, fields: {} as Record<string, string[]> },
	);
};

const VIETNAMESE_SPAM_PATTERNS = [
	/nhà cái/i,
	/cá cược/i,
	/trực tuyến.*(?:uy tín|casino|slot|cược)/i,
	/(?:casino|slot|cược).*trực tuyến/i,
	/khuyến mãi.*(?:cược|casino|slot)/i,
	/nạp tiền|rút tiền/i,
	/tỷ lệ kèo/i,
	/kèo nhà cái/i,
	/xổ số|nổ hũ/i,
];

const GAMBLING_URL_PATTERNS = [
	/\b(?:bet|casino|slot|poker|lottery|baccarat|sportsbook)\b/i,
	/\b\d{2,3}(?:win|bet|club|game|play|sport)\b/i,
	/\b(?:win|bet|club|game|play|sport)\d{2,3}\b/i,
	/\.(?:bet|casino|poker|games)\b/i,
];

const DISPOSABLE_EMAIL_DOMAINS = new Set([
	'mailto.plus',
	'rustyload.com',
	'kvegg.com',
	'pariag.com',
	'fenxz.com',
	'alexida.com',
	'cmhvzylmfc.com',
	'gghs96.org',
	'comfythings.com',
]);

const SPAM_SLUG_PATTERNS = [
	/^\d{2,3}(?:win|bet|game|play)/i,
	/(?:win|bet|game|play)\d{2,3}/i,
	/^nha-cai-/i,
	/^trang-chu-/i,
];

const bioMatchesWebsiteDomain = (
	bio: string | null | undefined,
	website: string | null | undefined,
): boolean => {
	if (!bio || !website) return false;

	try {
		const hostname = new URL(website).hostname.replace(/^www\./, '');
		const baseName = hostname.split('.')[0].toLowerCase();

		if (baseName.length < 4) return false;

		return bio.toLowerCase().includes(baseName);
	} catch {
		return false;
	}
};

export type UserCommentData = {
	totalComments: number;
	commentsWithLinks: number;
	linkUrls: string[];
	templateMatches: string[];
	commentsWithLinksAndTemplates: number;
	recentComments: Awaited<ReturnType<typeof getRecentDiscussionsForUserRaw>>;
};

const getUserCommentData = async (userId: string): Promise<UserCommentData> => {
	const comments = await getRecentDiscussionsForUserRaw(userId, 200);

	let commentsWithLinks = 0;
	let commentsWithLinksAndTemplates = 0;
	const allLinkUrls: string[] = [];
	const allTemplateMatches: string[] = [];

	for (const comment of comments) {
		const doc = comment.content as DocJson | null;
		const text = comment.text;
		const hasLink = containsLink(doc, text);

		if (hasLink) {
			commentsWithLinks++;
			const docLinks = extractLinksFromContent(doc);
			const textLinks = extractUrlsFromString(text);
			allLinkUrls.push(...(docLinks ?? []), ...(textLinks ?? []));
		}

		const templates = matchesCommentSpamTemplate(text);
		if (templates.length > 0) {
			allTemplateMatches.push(...templates);
			if (hasLink) {
				commentsWithLinksAndTemplates++;
			}
		}
	}

	return {
		recentComments: comments.slice(0, 5),
		totalComments: comments.length,
		commentsWithLinks,
		linkUrls: [...new Set(allLinkUrls)],
		templateMatches: [...new Set(allTemplateMatches)],
		commentsWithLinksAndTemplates,
	};
};

type SignalContext = {
	user: User;
	isAffiliated: boolean;
	commentData: UserCommentData;
	profilePhraseResult: { score: number; fields: Record<string, string[]> };
	bioUrls: string[];
};

type SpamSignal = {
	name: string;
	score: number | ((ctx: SignalContext) => number);
	test: (ctx: SignalContext) => boolean;
	evidence: (ctx: SignalContext) => string[];
};

const academicallySoundingPhrases = [
	'professor',
	'graduated',
	'is a',
	'degree',
	'bachelor',
	'master',
];

const spamSignals: SpamSignal[] = [
	{
		name: 'profile-spam-phrases',
		score: 0,
		test: (ctx) => ctx.profilePhraseResult.score > 0,
		evidence: (ctx) => {
			const { fields } = ctx.profilePhraseResult;
			return Object.entries(fields).flatMap(([field, phrases]) =>
				phrases.map((p) => `${field}: "${p}"`),
			);
		},
	},
	{
		name: 'website-not-affiliated',
		score: (ctx) => {
			let score = 3;

			// it's MORE suspicious if the user has no comments and an un-affiliated website
			if (ctx.commentData.totalComments === 0) {
				score += 2;
			}

			return score;
		},
		test: (ctx) => !!ctx.user.website && !ctx.isAffiliated,
		evidence: (ctx) => [ctx.user.website!],
	},
	{
		name: 'website-added-quickly',
		score: 1,
		test: (ctx) => {
			if (!ctx.user.website) return false;
			const createdAt = new Date(ctx.user.createdAt as unknown as string).getTime();
			const updatedAt = new Date(ctx.user.updatedAt as unknown as string).getTime();
			return (updatedAt - createdAt) / 60_000 < 5;
		},
		evidence: (ctx) => [ctx.user.website!],
	},
	{
		name: 'bio-contains-url',
		score: 2,
		test: (ctx) => ctx.bioUrls.length > 0,
		evidence: (ctx) => ctx.bioUrls,
	},
	{
		name: 'gambling-website',
		score: 3,
		test: (ctx) =>
			!!ctx.user.website && GAMBLING_URL_PATTERNS.some((p) => p.test(ctx.user.website!)),
		evidence: (ctx) => [ctx.user.website!],
	},
	{
		name: 'website-with-88',
		score: 2,
		test: (ctx) => !!ctx.user.website && ctx.user.website.includes('88'),
		evidence: (ctx) => [ctx.user.website!],
	},
	{
		name: 'vietnamese-gambling-bio',
		score: 3,
		test: (ctx) => VIETNAMESE_SPAM_PATTERNS.some((p) => p.test(ctx.user.bio ?? '')),
		evidence: (ctx) => {
			const bio = ctx.user.bio ?? '';
			return VIETNAMESE_SPAM_PATTERNS.filter((p) => p.test(bio)).map((p) => p.source);
		},
	},
	{
		name: 'spam-slug-pattern',
		score: 2,
		test: (ctx) => SPAM_SLUG_PATTERNS.some((p) => p.test(ctx.user.slug)),
		evidence: (ctx) => [ctx.user.slug],
	},
	{
		name: 'disposable-email',
		score: 2,
		test: (ctx) => {
			const domain = ctx.user.email?.split('@')[1]?.toLowerCase();
			return DISPOSABLE_EMAIL_DOMAINS.has(domain);
		},
		evidence: (ctx) => [ctx.user.email],
	},
	{
		name: 'bio-promotes-website',
		score: 2,
		test: (ctx) => !ctx.isAffiliated && bioMatchesWebsiteDomain(ctx.user.bio, ctx.user.website),
		evidence: (ctx) => [ctx.user.website!, ctx.user.bio?.slice(0, 200) ?? ''],
	},
	{
		name: 'comments-with-links',
		score: (ctx) => {
			// just posting links doesn't really do anything
			let score = 0;

			// some problem with old frankenbook comments, ignore those
			if (
				ctx.commentData.recentComments.some(
					(c) =>
						c.communitySubdomain === 'frankenbook' &&
						new Date(c.createdAt) < new Date('2020-01-01'),
				)
			) {
				//
				return 0;
			}

			// very suspicious if all your comments are just links
			if (ctx.commentData.commentsWithLinks === ctx.commentData.totalComments) {
				score += 3;
			}

			// no affil is slightly suspicious
			if (!ctx.isAffiliated) {
				score += 3;
			}

			// more than 5 comments with links is also sus
			if (ctx.commentData.commentsWithLinks > 4) {
				score += 3;
			}

			return score;
		},
		test: (ctx) => ctx.commentData.totalComments > 0 && ctx.commentData.commentsWithLinks > 0,
		evidence: (ctx) => [
			`${ctx.commentData.commentsWithLinks}/${ctx.commentData.totalComments} comments`,
		],
	},
	{
		name: 'template-spam-with-links',
		score: 2,
		test: (ctx) => ctx.commentData.commentsWithLinksAndTemplates > 0,
		evidence: (ctx) => ctx.commentData.templateMatches.slice(0, 10),
	},
	{
		name: 'bio contains attempted html',
		score: 6,
		test: (ctx) =>
			!!ctx.user.bio && (/<(a|p)/.test(ctx.user.bio) || !!ctx.user.bio.includes('href=')),
		evidence: (ctx) => [ctx.user.bio!],
	},

	// negative signals
	{
		name: '-edu-email',
		score: -10,
		test: (ctx) => !!ctx.user.email?.endsWith('.edu'),
		evidence: (ctx) => [ctx.user.email],
	},
	// bit more lenient towards accounts made pre 2020
	{
		name: '-old-account',
		score: -2,
		test: (ctx) => {
			const createdAt = new Date(ctx.user.createdAt as unknown as string).getTime();
			const now = new Date('2020-01-01T00:00:00Z').getTime();
			return createdAt < now;
		},
		evidence: (ctx) => [ctx.user.createdAt as unknown as string],
	},
	{
		name: '-academically-sounding-bio-phrases',
		score: (ctx) => {
			let score = 0;
			if (academicallySoundingPhrases.some((p) => ctx.user.bio?.toLowerCase().includes(p))) {
				score += 2;
			}
			return -score;
		},
		test: (ctx) => {
			return academicallySoundingPhrases.some((p) => ctx.user.bio?.toLowerCase().includes(p));
		},
		evidence: (ctx) => [ctx.user.bio ?? ''],
	},
];

export type SignalHit = {
	name: string;
	score: number;
	evidence: string[];
};

export type UserSpamReport = {
	score: number;
	fields: Record<string, string[]>;
	signals: string[];
	signalHits: SignalHit[];
	commentData: UserCommentData;
};

export const computeUserSpamReport = async (user: User): Promise<UserSpamReport> => {
	const profilePhraseResult = getProfilePhraseScore(user);
	const bioUrls = extractUrlsFromString(user.bio) ?? [];

	const [isAffiliated, commentData] = await Promise.all([
		getLegitimateAffiliationsForUser(user.id),
		getUserCommentData(user.id),
	]);

	const ctx: SignalContext = {
		user,
		isAffiliated,
		commentData,
		profilePhraseResult,
		bioUrls,
	};

	const signalHits: SignalHit[] = [];
	let score = 0;

	// profile-spam-phrases is special: its score comes from the phrase matcher, not from the config
	const fields: Record<string, string[]> = {};

	for (const signal of spamSignals) {
		if (!signal.test(ctx)) continue;

		const signalScore =
			signal.name === 'profile-spam-phrases'
				? profilePhraseResult.score
				: typeof signal.score === 'function'
					? signal.score(ctx)
					: signal.score;

		const evidence = signal.evidence(ctx);

		score += signalScore;
		signalHits.push({ name: signal.name, score: signalScore, evidence });
	}

	if (profilePhraseResult.score > 0) {
		Object.assign(fields, profilePhraseResult.fields);
	}

	const commentLinksHit = signalHits.find((h) => h.name === 'comments-with-links-not-affiliated');
	if (commentLinksHit) {
		fields.suspiciousCommentLinks = commentLinksHit.evidence;
	}

	const templateHit = signalHits.find((h) => h.name === 'template-spam-with-links');
	if (templateHit) {
		fields.templateSpamComments = templateHit.evidence;
	}

	const websiteHit = signalHits.find((h) => h.name === 'website-not-affiliated');
	if (websiteHit) {
		fields.website = websiteHit.evidence;
	}

	const bioUrlHit = signalHits.find((h) => h.name === 'bio-contains-url');
	if (bioUrlHit) {
		fields.bioUrl = bioUrlHit.evidence;
	}

	score = Math.max(score, 0);

	return {
		score,
		fields,
		signals: signalHits.map((h) => h.name),
		signalHits,
		commentData,
	};
};

export const getSuspectedUserSpamVerdict = (user: User): types.SpamVerdict<SpamTag> => {
	const { score, fields } = getProfilePhraseScore(user);
	return {
		fields,
		spamScore: score,
		spamScoreVersion: CURRENT_SPAM_SCORE_VERSION,
		spamScoreComputedAt: new Date(),
	};
};

export const computeFullUserSpamVerdict = async (
	user: User,
): Promise<types.SpamVerdict<SpamTag> & { signals: string[] }> => {
	const report = await computeUserSpamReport(user);
	return {
		fields: report.fields,
		spamScore: report.score,
		spamScoreVersion: CURRENT_SPAM_SCORE_VERSION,
		spamScoreComputedAt: new Date(),
		signals: report.signals,
	};
};
