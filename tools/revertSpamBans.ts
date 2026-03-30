/*
revertSpamBans -- bulk revert for spam-tag bans

usage:
  npm run tools revertSpamBans --reason automatedScan --since 2026-03-20T00:00:00Z --to 2026-03-21T00:00:00Z [--min-score N] [--max-score N] [--concurrency 10]
  npm run tools revertSpamBans --reason automatedScan --from 2026-03-20 --to 2026-03-21 --max-score 8 --execute

notes:
  --reason is required and must be a spam fields key.
  --since and --from are aliases.
  without --execute, this runs in dry-run mode.
*/
/** biome-ignore-all lint/suspicious/noConsole: cli script needs terminal logs */

import type { SpamFieldsFilterKey, UserSpamTagFields } from 'types';

import { literal, Op } from 'sequelize';

import { SpamTag } from 'server/models';
import { asyncMap } from 'utils/async';

const DEFAULT_CONCURRENCY = 10;

const supportedReasons = new Set<SpamFieldsFilterKey>([
	'honeypotTriggers',
	'suspiciousFiles',
	'suspiciousComments',
	'manuallyMarkedBy',
	'automatedScan',
]);

const parseArg = (name: string): string | null => {
	const prefix = `--${name}=`;
	const combined = process.argv.find((arg) => arg.startsWith(prefix));
	if (combined) {
		return combined.slice(prefix.length);
	}

	const index = process.argv.indexOf(`--${name}`);
	if (index === -1 || index + 1 >= process.argv.length) {
		return null;
	}

	const next = process.argv[index + 1];
	if (next.startsWith('--')) {
		return null;
	}

	return next;
};

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const parseDateArg = (
	value: string | null,
	flagName: string,
	options: { allowDuration?: boolean } = {},
): Date => {
	const { allowDuration = false } = options;

	if (!value) {
		console.error(`${flagName} is required`);
		process.exit(1);
	}

	if (allowDuration) {
		const durationMatch = value.match(/^(\d+)([hd])$/);
		if (durationMatch) {
			const amount = parseInt(durationMatch[1], 10);
			const unit = durationMatch[2];
			const ms = unit === 'h' ? amount * 3600_000 : amount * 86_400_000;
			return new Date(Date.now() - ms);
		}
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		console.error(`invalid ${flagName} value: ${value}`);
		process.exit(1);
	}

	return parsed;
};

const parseNumberArg = (name: string, fallback: number): number => {
	const raw = parseArg(name);
	if (raw == null) {
		return fallback;
	}

	const parsed = Number(raw);
	if (Number.isNaN(parsed)) {
		console.error(`invalid --${name} value: ${raw}`);
		process.exit(1);
	}

	return parsed;
};

const getReasonScore = (
	reason: SpamFieldsFilterKey,
	fields: UserSpamTagFields | undefined,
	fallback: number,
): number => {
	if (reason !== 'automatedScan') {
		return fallback;
	}

	const scans = fields?.automatedScan;
	const lastScan = scans?.[scans.length - 1];

	if (!lastScan || typeof lastScan.score !== 'number') {
		return fallback;
	}

	return lastScan.score;
};

async function main() {
	const reasonArg = parseArg('reason');
	const isInvalidReason = !reasonArg || !supportedReasons.has(reasonArg as SpamFieldsFilterKey);
	if (isInvalidReason) {
		console.error(
			`--reason is required and must be one of: ${Array.from(supportedReasons).join(', ')}`,
		);
		process.exit(1);
	}

	const reason = reasonArg as SpamFieldsFilterKey;

	const sinceArg = parseArg('since') ?? parseArg('from');
	const toArg = parseArg('to');
	const since = parseDateArg(sinceArg, '--since/--from', { allowDuration: true });
	const to = parseDateArg(toArg, '--to');

	const hasInvalidRange = since >= to;
	if (hasInvalidRange) {
		console.error('--since/--from must be earlier than --to');
		process.exit(1);
	}

	const minScore = parseNumberArg('min-score', Number.NEGATIVE_INFINITY);
	const maxScore = parseNumberArg('max-score', Number.POSITIVE_INFINITY);
	const hasInvalidScores = minScore > maxScore;
	if (hasInvalidScores) {
		console.error('--min-score must be less than or equal to --max-score');
		process.exit(1);
	}

	const concurrency = Math.trunc(parseNumberArg('concurrency', DEFAULT_CONCURRENCY));
	const hasInvalidConcurrency = !Number.isFinite(concurrency) || concurrency < 1;
	if (hasInvalidConcurrency) {
		console.error('--concurrency must be a positive integer');
		process.exit(1);
	}

	const shouldExecute = hasFlag('execute');
	const escapedReason = SpamTag.sequelize!.escape(reason);
	const reasonCondition = literal(`(
		"fields"->>${escapedReason} IS NOT NULL
		AND jsonb_typeof("fields"->${escapedReason}) = 'array'
		AND jsonb_array_length("fields"->${escapedReason}) > 0
	)`);

	const tags = await SpamTag.findAll({
		where: {
			[Op.and]: [
				{ status: 'confirmed-spam' },
				{ statusUpdatedAt: { [Op.gte]: since, [Op.lte]: to } },
				reasonCondition,
			],
		},
		attributes: ['id', 'status', 'statusUpdatedAt', 'fields', 'spamScore'],
		order: [['statusUpdatedAt', 'ASC']],
	});

	const matching = tags.filter((tag) => {
		const fields = tag.fields as UserSpamTagFields | undefined;
		const score = getReasonScore(reason, fields, tag.spamScore);
		return score >= minScore && score <= maxScore;
	});

	const minLabel = Number.isFinite(minScore) ? String(minScore) : '-inf';
	const maxLabel = Number.isFinite(maxScore) ? String(maxScore) : '+inf';

	console.log(
		[
			`reason=${reason}`,
			`since=${since.toISOString()}`,
			`to=${to.toISOString()}`,
			`min-score=${minLabel}`,
			`max-score=${maxLabel}`,
			`execute=${shouldExecute}`,
		].join(' '),
	);
	console.log(`found ${tags.length} confirmed-spam tags, ${matching.length} match score bounds`);

	if (!shouldExecute) {
		const preview = matching.slice(0, 20).map((tag) => {
			const fields = tag.fields as UserSpamTagFields | undefined;
			const score = getReasonScore(reason, fields, tag.spamScore);
			return `${tag.id} score=${score} statusUpdatedAt=${tag.statusUpdatedAt?.toISOString?.() ?? String(tag.statusUpdatedAt)}`;
		});

		if (preview.length > 0) {
			console.log('preview (first 20):');
			console.log(preview.join('\n'));
		}

		console.log('dry run complete. pass --execute to apply updates.');
		return;
	}

	let updated = 0;
	let errors = 0;

	await asyncMap(
		matching,
		async (tag) => {
			try {
				await tag.update({
					status: 'unreviewed',
					statusUpdatedAt: new Date(),
				});
				updated++;

				if (updated % 100 === 0) {
					console.log(`progress: updated=${updated} errors=${errors}`);
				}
			} catch (error) {
				errors++;
				console.error(`error reverting spam tag ${tag.id}:`, error);
			}
		},
		{ concurrency },
	);

	console.log(
		`done. reverted=${updated} skipped=${tags.length - matching.length} errors=${errors}`,
	);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('fatal error:', error);
		process.exit(1);
	});
