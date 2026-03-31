/*
scanSpamUsers -- two-phase bulk spam detection tool

usage:
  npm run tools scanSpamUsers --analyze --output results.json [options]
  npm run tools scanSpamUsers --execute --input results.json [options]
  npm run tools scanSpamUsers --report --input results.json [--execute-input executed.json]

analyze phase:
  scans users without an existing spam tag, computes spam scores, and
  writes a json file with detailed evidence for each flagged user.

  --output <path>          required. where to write the results json.
  --min-score <n>          minimum score to include in output. default 5.
  --input <path>           optional. path to an existing results json whose
                           user ids will be skipped (re-run incrementally).
  --since <date|duration>  only scan users created (or who commented) after
                           this date (ISO string) or duration like "24h", "7d".
  --mode <mode>            scanning mode. default "new-accounts".
                           "new-accounts"     scan users created since --since.
                           "recent-comments"  scan users who commented since
                                              --since, regardless of account age.
                                              requires --since.
  --exclude-signals <s,s>  comma-separated signal names to skip during scoring.
  --skip-profile-signals   convenience flag: exclude all profile/website/bio
                           signals (useful for comment-focused scans).
  --concurrency <n>        how many users to process in parallel. default 10.
  --include-clean          also write a .clean.json file with users that scored
                           > 0 but below --min-score (for reviewing false negatives).

execute phase:
  reads a results json produced by --analyze and applies spam tags.

  --input <path>         required. the results json from analyze.
  --min-score <n>        only tag users whose score >= n.
  --signals <s1,s2,...>  only tag users who have ALL of these signals.
  --range <start>-<end>  only process entries in [start, end) (0-based).
  --concurrency <n>      how many users to tag in parallel. default 5.
  --ban                  set status to confirmed-spam instead of unreviewed.
                         side effects (session invalidation, cache purge) are
                         skipped for performance.

report phase:
  uploads analyze (and optionally execute) results to s3 and sends a summary
  email to the dev team.

  --input <path>         required. the analyze results json.
  --execute-input <path> optional. the execute results json (if separate).
*/
/** biome-ignore-all lint/performance/noAwaitInLoops: batch pagination loop is inherently sequential */

import type { DocJson } from 'types';

import * as fs from 'fs';
import * as path from 'path';
import { Op } from 'sequelize';

import { ThreadComment, User } from 'server/models';
import { extractLinksFromContent, extractUrlsFromString } from 'server/spamTag/commentSpam';
import { containsLink } from 'server/spamTag/contentAnalysis';
import { DEV_TEAM_EMAIL } from 'server/spamTag/notifications/email';
import {
	getRecentDiscussionsForUser,
	getRecentDiscussionsForUserRaw,
} from 'server/spamTag/userDashboard';
import { upsertSpamTag } from 'server/spamTag/userQueries';
import {
	computeUserSpamReport,
	type SignalHit,
	type SpamReportOptions,
	type UserCommentData,
	type UserSpamReport,
} from 'server/spamTag/userScore';
import { sendEmail } from 'server/utils/email/reset';
import { assetsClient, createPubPubS3Client } from 'server/utils/s3';
import { asyncMap } from 'utils/async';
import { JsonArrayWriter } from 'utils/jsonArrayWriter';

const BATCH_SIZE = 200;
const DEFAULT_MIN_SCORE = 5;
const DEFAULT_ANALYZE_CONCURRENCY = 5;
const DEFAULT_EXECUTE_CONCURRENCY = 5;

const PROFILE_SIGNAL_NAMES = new Set([
	'profile-spam-phrases',
	'website-not-affiliated',
	'website-added-quickly',
	'bio-contains-url',
	'gambling-website',
	'website-with-88',
	'vietnamese-gambling-bio',
	'bio-promotes-website',
	'bio contains attempted html',
]);

const getRecentCommenterUserIds = async (since: Date): Promise<string[]> => {
	const results = await ThreadComment.findAll({
		where: { createdAt: { [Op.gte]: since } },
		attributes: ['userId'],
		group: ['userId'],
		raw: true,
	});

	return results.map((r: any) => r.userId as string);
};

type CommentEvidence = {
	text: string;
	links: string[];
	phraseMatches: string[];
};

type AnalyzeEntry = {
	index: number;
	userId: string;
	email: string;
	slug: string;
	fullName: string;
	createdAt: string;
	score: number;
	signals: string[];
	signalHits: SignalHit[];
	commentCount: number;
	commentsWithLinks: number;
	commentPhraseMatches: string[];
	recentComments: CommentEvidence[];
	profile: {
		website: string | null;
		bio: string | null;
		bioUrls: string[];
	} | null;
};

const parseArg = (name: string): string | null => {
	const prefix = `--${name}=`;
	const combined = process.argv.find((a) => a.startsWith(prefix));
	if (combined) return combined.slice(prefix.length);

	const idx = process.argv.indexOf(`--${name}`);
	if (idx === -1 || idx + 1 >= process.argv.length) return null;

	const next = process.argv[idx + 1];
	if (next.startsWith('--')) return null;

	return next;
};

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const parseSinceArg = (value: string | null): Date | null => {
	if (!value) return null;

	const durationMatch = value.match(/^(\d+)([hd])$/);
	if (durationMatch) {
		const amount = parseInt(durationMatch[1], 10);
		const unit = durationMatch[2];
		const ms = unit === 'h' ? amount * 3600_000 : amount * 86_400_000;
		return new Date(Date.now() - ms);
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		console.error(
			`invalid --since value: ${value} (use ISO date or duration like "24h", "7d")`,
		);
		process.exit(1);
	}

	return date;
};

const buildEntry = async (user: User, report: UserSpamReport): Promise<AnalyzeEntry> => {
	// const commentInfo = await getRecentCommentsWithLinks(user.id, 5);
	const hasProfileSignal = report.signals.some((s) => s.includes('website') || s.includes('bio'));

	const profile = hasProfileSignal
		? {
				website: user.website ?? null,
				bio: user.bio ?? null,
				bioUrls: extractUrlsFromString(user.bio) ?? [],
			}
		: null;

	return {
		index: 0,
		userId: user.id,
		email: user.email ?? '',
		slug: user.slug,
		fullName: user.fullName,
		createdAt: String(user.createdAt),
		score: report.score,
		signals: report.signals,
		signalHits: report.signalHits,
		commentCount: report.commentData.totalComments,
		commentsWithLinks: report.commentData.commentsWithLinks,
		commentPhraseMatches: report.commentData.commentPhraseMatches,
		recentComments: report.commentData.recentComments,
		profile,
	};
};

async function analyze() {
	const outputPath = parseArg('output');
	if (!outputPath) {
		console.error('--output is required for --analyze');
		process.exit(1);
	}

	const minScore = parseInt(parseArg('min-score') ?? String(DEFAULT_MIN_SCORE), 10);
	const concurrency = parseInt(
		parseArg('concurrency') ?? String(DEFAULT_ANALYZE_CONCURRENCY),
		10,
	);
	const sinceDate = parseSinceArg(parseArg('since'));
	const includeClean = hasFlag('include-clean');
	const cleanPath = includeClean ? outputPath.replace(/\.json$/, '.clean.json') : null;
	const mode = parseArg('mode') ?? 'new-accounts';

	const skipProfileSignals = hasFlag('skip-profile-signals');
	const excludeSignalsArg = parseArg('exclude-signals');
	const excludeSignals = [
		...(excludeSignalsArg ? excludeSignalsArg.split(',') : []),
		...(skipProfileSignals ? [...PROFILE_SIGNAL_NAMES] : []),
	];

	const reportOptions: SpamReportOptions | undefined =
		excludeSignals.length > 0 ? { excludeSignals } : undefined;

	if (mode === 'recent-comments' && !sinceDate) {
		console.error('--since is required for --mode recent-comments');
		process.exit(1);
	}

	const skipIds = new Set<string>();
	const inputPath = parseArg('input');
	if (inputPath) {
		const existing: AnalyzeEntry[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
		for (const e of existing) skipIds.add(e.userId);
		console.log(`loaded ${skipIds.size} user ids to skip from ${inputPath}`);
	}

	const sinceLabel = sinceDate ? ` since=${sinceDate.toISOString()}` : '';
	const cleanLabel = cleanPath ? ` clean=${cleanPath}` : '';
	const excludeLabel = excludeSignals.length > 0 ? ` exclude=[${excludeSignals.join(',')}]` : '';
	console.log(
		`analyzing users (mode=${mode}, min-score=${minScore}, concurrency=${concurrency}${sinceLabel}${cleanLabel}${excludeLabel}, output=${outputPath})`,
	);

	const writer = new JsonArrayWriter<AnalyzeEntry>(outputPath);
	const cleanWriter = cleanPath ? new JsonArrayWriter<AnalyzeEntry>(cleanPath) : null;

	let scanned = 0;
	let errors = 0;

	const whereClause: Record<string, unknown> = {
		spamTagId: { [Op.is]: null as any },
	};

	// for recent-comments mode, first collect commenter user ids, then use those
	// as the pool of users to check. for new-accounts mode, filter by creation date.
	if (mode === 'recent-comments') {
		const allCommenterIds = await getRecentCommenterUserIds(sinceDate!);
		const filteredIds = allCommenterIds.filter((id) => !skipIds.has(id));
		console.log(
			`found ${allCommenterIds.length} recent commenters (${filteredIds.length} after skipping known ids)`,
		);
		whereClause.id = { [Op.in]: filteredIds };
	} else if (sinceDate) {
		whereClause.createdAt = { [Op.gte]: sinceDate };
	}

	let offset = 0;

	while (true) {
		const users = await User.findAll({
			where: whereClause,
			attributes: [
				'id',
				'fullName',
				'email',
				'slug',
				'title',
				'bio',
				'website',
				'createdAt',
				'updatedAt',
			],
			limit: BATCH_SIZE,
			offset,
			order: [['createdAt', 'ASC']],
		});

		if (users.length === 0) break;

		const toProcess = users.filter((u) => !skipIds.has(u.id));
		scanned += users.length;

		const results = await asyncMap(
			toProcess,
			async (user) => {
				try {
					const report = await computeUserSpamReport(user, reportOptions);
					return { user, report };
				} catch (err) {
					errors++;
					console.error(`error analyzing user ${user.id}:`, err);
					return null;
				}
			},
			{ concurrency },
		);

		for (const result of results) {
			if (!result) continue;

			const { user, report } = result;

			if (report.score >= minScore) {
				const entry = await buildEntry(user, report);
				entry.index = writer.length;
				writer.push(entry);
			} else if (cleanWriter) {
				const entry = await buildEntry(user, report);
				entry.index = cleanWriter.length;
				cleanWriter.push(entry);
			}
		}

		console.log(
			`[${new Date().toISOString()}] scanned=${scanned} flagged=${writer.length}` +
				`${cleanWriter ? ` clean=${cleanWriter.length}` : ''} errors=${errors}`,
		);
		offset += BATCH_SIZE;
	}

	writer.close();
	cleanWriter?.close();

	console.log(`done. scanned=${scanned}, wrote ${writer.length} entries to ${outputPath}`);

	if (cleanWriter) {
		console.log(`wrote ${cleanWriter.length} clean (below-threshold) entries to ${cleanPath}`);
	}
}

async function execute() {
	const inputPath = parseArg('input');
	if (!inputPath) {
		console.error('--input is required for --execute');
		process.exit(1);
	}

	const entries: AnalyzeEntry[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
	const minScore = parseInt(parseArg('min-score') ?? String(DEFAULT_MIN_SCORE), 10);
	const concurrency = parseInt(
		parseArg('concurrency') ?? String(DEFAULT_EXECUTE_CONCURRENCY),
		10,
	);
	const signalsArg = parseArg('signals');
	const requiredSignals = signalsArg ? signalsArg.split(',') : [];
	const shouldBan = hasFlag('ban');

	const rangeArg = parseArg('range');
	let rangeStart = 0;
	let rangeEnd = entries.length;
	if (rangeArg) {
		const [s, e] = rangeArg.split('-').map(Number);
		rangeStart = s;
		rangeEnd = e;
	}

	const filtered = entries.filter((entry) => {
		if (entry.index < rangeStart || entry.index >= rangeEnd) return false;
		if (entry.score < minScore) return false;

		if (requiredSignals.length > 0) {
			const hasAll = requiredSignals.every((s) => entry.signals.includes(s));
			if (!hasAll) return false;
		}

		return true;
	});

	console.log(
		`executing on ${inputPath}: ${entries.length} total, ${filtered.length} after filters, ` +
			`min-score=${minScore}, signals=${requiredSignals.join(',') || 'any'}, ` +
			`range=[${rangeStart}, ${rangeEnd}), concurrency=${concurrency}, ban=${shouldBan}`,
	);

	let tagged = 0;
	let errors = 0;

	await asyncMap(
		filtered,
		async (entry) => {
			try {
				await upsertSpamTag({
					userId: entry.userId,
					status: shouldBan ? 'confirmed-spam' : undefined,
					fields: {
						suspiciousComments: entry.recentComments
							.flatMap((c) => c.links)
							.slice(0, 10),
						automatedScan: [
							{
								score: entry.score,
								signals: entry.signals,
								signalHits: entry.signalHits,
								scannedAt: new Date().toISOString(),
							},
						],
					},
				});

				tagged++;
				if (tagged % 50 === 0) {
					console.log(`progress: tagged=${tagged} errors=${errors}`);
				}
			} catch (err) {
				errors++;
				console.error(`error tagging user ${entry.userId} (${entry.slug}):`, err);
			}
		},
		{ concurrency },
	);

	console.log(
		`done. tagged=${tagged} skipped=${entries.length - filtered.length} errors=${errors}`,
	);
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

const uploadReportToS3 = async (localPath: string, s3Key: string) => {
	const s3 = assetsClient;
	const stream = fs.createReadStream(localPath);
	const result = await s3.uploadFile(s3Key, stream);

	console.log(`uploaded ${localPath} to ${result.url}`);
	return result.url;
};

const buildSummary = (entries: AnalyzeEntry[], label: string): string => {
	if (entries.length === 0) return `${label}: 0 entries`;

	const signalCounts: Record<string, number> = {};
	let totalScore = 0;

	for (const entry of entries) {
		totalScore += entry.score;
		for (const signal of entry.signals) {
			signalCounts[signal] = (signalCounts[signal] ?? 0) + 1;
		}
	}

	const avgScore = (totalScore / entries.length).toFixed(1);

	const sortedSignals = Object.entries(signalCounts)
		.sort(([, a], [, b]) => b - a)
		.map(([name, count]) => `  ${name}: ${count}`)
		.join('\n');

	return [
		`${label}: ${entries.length} entries (avg score ${avgScore})`,
		'',
		'signal breakdown:',
		sortedSignals,
	].join('\n');
};

async function report() {
	const inputPath = parseArg('input');
	if (!inputPath) {
		console.error('--input is required for --report');
		process.exit(1);
	}

	const executeInputPath = parseArg('execute-input');
	const dateStamp = new Date().toISOString().slice(0, 10);
	const s3Prefix = `spam-scans/${dateStamp}`;

	const analyzeEntries: AnalyzeEntry[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
	const analyzeS3Key = `${s3Prefix}/${path.basename(inputPath)}`;
	const analyzeUrl = await uploadReportToS3(inputPath, analyzeS3Key);

	let executeUrl: string | null = null;
	let executedEntries: AnalyzeEntry[] | null = null;

	if (executeInputPath && fs.existsSync(executeInputPath)) {
		executedEntries = JSON.parse(fs.readFileSync(executeInputPath, 'utf-8'));
		const executeS3Key = `${s3Prefix}/${path.basename(executeInputPath)}`;
		executeUrl = await uploadReportToS3(executeInputPath, executeS3Key);
	}

	const analyzeSummary = buildSummary(analyzeEntries, 'analyzed (flagged)');
	const executeSummary = executedEntries
		? buildSummary(executedEntries, 'executed (tagged)')
		: null;

	const emailBody = [
		`spam scan report for ${dateStamp}`,
		'',
		analyzeSummary,
		`report: ${analyzeUrl}`,
		'',
		...(executeSummary ? [executeSummary, `report: ${executeUrl}`, ''] : []),
		'-- PubPub Spam Scanner',
	].join('\n');

	await sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `spam scan report: ${dateStamp} (${analyzeEntries.length} flagged)`,
		text: emailBody,
	});

	console.log(`report email sent to ${DEV_TEAM_EMAIL}`);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
	if (hasFlag('analyze')) return analyze();
	if (hasFlag('execute')) return execute();
	if (hasFlag('report')) return report();
	console.error('specify --analyze, --execute, or --report');
	process.exit(1);
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('fatal error:', err);
		process.exit(1);
	});
