import { Op } from 'sequelize';

import { getCommunityDepositTarget } from 'server/depositTarget/queries';
import { Collection, Community, CrossrefDepositRecord, Pub, Release } from 'server/models';
import { expect } from 'utils/assert';
import { renderJournalCitation } from 'utils/citations';
import { PUBPUB_DOI_PREFIX } from 'utils/crossref/communities';
import {
	getDepositRecordContentVersion,
	getDepositRecordReviewRecommendation,
	getDepositRecordReviewType,
	isPreprintDeposit,
} from 'utils/crossref/parseDeposit';
import normalizeIssn from 'utils/crossref/transform/issn';

import {
	fetchSubmissionResult,
	findMetadataPubPubDoesNotSend,
	getCrossrefWork,
	getSubmissionHost,
	isTestCrossref,
	type SubmissionRecord,
} from './crossrefChecks';
import { checkIssnWithCrossref } from './issnChecks';
import { assertCommunityApprovedForDoi } from './permissions';
import { getDoiData, setDoiData } from './queries';
import { getDepositFilename, resolveCrossrefCredentials } from './submit';
import { validatePubRelationshipsForDeposit } from './validate';

/**
 * Redeposits a community's existing DOIs with Crossref, rebuilding each deposit from current data.
 * Used when a fix to the deposit code needs to reach records that were deposited before it.
 *
 * It is deliberately conservative. Each item is rebuilt and compared with its last deposit and its
 * live Crossref record just before it is sent, and skipped (with the reason) if the redeposit would
 * change its DOI, record type, issue, or journal, or drop metadata PubPub doesn't send. The previous
 * deposit record is copied before it is overwritten. After sending, Crossref's submission log is
 * read for each deposit, since an accepted upload only means it was queued.
 */

export type RedepositItem = {
	kind: 'collection' | 'pub';
	id: string;
	title: string;
	slug: string;
	doi: string;
};

export type RedepositStatus =
	/** Passed every check; a check-only run stops here. */
	| 'ready'
	/** Not sent; `message` says why. */
	| 'skipped'
	/** Sending failed; Crossref never received it. */
	| 'error'
	/** Received by Crossref, result not known yet. */
	| 'submitted'
	| 'succeeded'
	| 'warning'
	| 'failed'
	/** Sent, but Crossref hadn't finished processing it when we stopped checking. */
	| 'unverified';

export type RedepositResult = RedepositItem & {
	status: RedepositStatus;
	message?: string;
	/** Informational differences from the last deposit (URL, title) that the redeposit sends. */
	changes?: string[];
	submissionFile?: string;
	/** A copy of the deposit record as it was before this redeposit. */
	backupDepositRecordId?: string;
};

export type RedepositOptions = {
	/** Deposit only this pub (by slug). Collections are skipped. */
	pubSlug?: string;
	/** Deposit only the first N pubs. Collections are skipped. */
	limit?: number;
};

export type RedepositPlan = {
	community: {
		id: string;
		title: string;
		subdomain: string;
		electronicIssn: string | null;
		printIssn: string | null;
	};
	doiPrefix: string;
	submissionHost: string | null;
	isTestCrossref: boolean;
	/** Things to look at before running. None of them stop a run on their own. */
	warnings: string[];
	items: RedepositItem[];
	skipped: {
		/** Pubs with a DOI but no deposit record, so we can't tell PubPub registered them. */
		pubsWithoutDepositRecord: number;
		/** Pubs with a deposit record but no release; the deposit API refuses these. */
		pubsWithoutRelease: number;
	};
};

export class RedepositError extends Error {}

const depositRecordInclude = {
	model: CrossrefDepositRecord,
	as: 'crossrefDepositRecord',
	attributes: ['id', 'depositJson'],
};

const getIssnWarnings = async (community: Community) => {
	const { title, citeAs } = community;
	const journalTitle = renderJournalCitation('', citeAs, title);
	const entries = [
		{ type: 'electronic' as const, raw: community.electronicIssn },
		{ type: 'print' as const, raw: community.printIssn },
	].filter((entry) => entry.raw?.trim());
	if (!entries.length) {
		return [
			'This community has no ISSN set in its settings, so deposits will only carry ISSNs set on individual issues.',
		];
	}
	const warnings = await Promise.all(
		entries.map(async ({ type, raw }) => {
			const issn = normalizeIssn(raw);
			if (!issn) {
				return [
					`The community's ${type} ISSN "${raw}" isn't a valid ISSN (check the digits), so it will be left out of deposits.`,
				];
			}
			return (await checkIssnWithCrossref(issn, type, journalTitle)).problems;
		}),
	);
	return warnings.flat();
};

export const getRedepositPlan = async (
	communityId: string,
	options: RedepositOptions = {},
): Promise<RedepositPlan> => {
	const { pubSlug, limit } = options;
	const isPartial = Boolean(pubSlug || limit);
	const [community, depositTarget] = await Promise.all([
		Community.findByPk(communityId, {
			attributes: ['id', 'title', 'subdomain', 'electronicIssn', 'printIssn', 'citeAs'],
		}),
		getCommunityDepositTarget(communityId),
	]);
	if (!community) {
		throw new RedepositError('Community not found.');
	}
	if (depositTarget?.service === 'datacite') {
		throw new RedepositError(
			'This community registers DOIs with DataCite. Redeposit only supports Crossref.',
		);
	}

	const [collections, pubs, issnWarnings] = await Promise.all([
		isPartial
			? []
			: Collection.findAll({
					where: {
						communityId,
						doi: { [Op.ne]: null },
						crossrefDepositRecordId: { [Op.ne]: null },
					},
					attributes: ['id', 'title', 'slug', 'doi'],
					order: [
						['createdAt', 'ASC'],
						['id', 'ASC'],
					],
				}),
		Pub.findAll({
			where: {
				communityId,
				doi: { [Op.ne]: null },
				...(pubSlug && { slug: pubSlug }),
			},
			attributes: ['id', 'title', 'slug', 'doi', 'crossrefDepositRecordId'],
			include: [{ model: Release, as: 'releases', attributes: ['id'] }],
			order: [
				['createdAt', 'ASC'],
				['id', 'ASC'],
			],
		}),
		getIssnWarnings(community),
	]);

	const pubsWithRecord = pubs.filter((pub) => pub.crossrefDepositRecordId);
	const depositablePubs = pubsWithRecord.filter((pub) => pub.releases?.length);
	const selectedPubs = limit ? depositablePubs.slice(0, limit) : depositablePubs;
	const submissionHost = getSubmissionHost();
	const warnings = [...issnWarnings];
	if (isTestCrossref()) {
		warnings.push(
			`Deposits go to Crossref's test system (${submissionHost}), so the live-record checks are skipped.`,
		);
	}

	return {
		community: {
			id: communityId,
			title: community.title,
			subdomain: community.subdomain,
			electronicIssn: normalizeIssn(community.electronicIssn),
			printIssn: normalizeIssn(community.printIssn),
		},
		doiPrefix: depositTarget?.doiPrefix ?? PUBPUB_DOI_PREFIX,
		submissionHost,
		isTestCrossref: isTestCrossref(),
		warnings,
		items: [
			...collections.map(
				(collection): RedepositItem => ({
					kind: 'collection',
					id: collection.id,
					title: collection.title,
					slug: collection.slug,
					doi: expect(collection.doi),
				}),
			),
			...selectedPubs.map(
				(pub): RedepositItem => ({
					kind: 'pub',
					id: pub.id,
					title: pub.title,
					slug: pub.slug,
					doi: expect(pub.doi),
				}),
			),
		],
		skipped: {
			pubsWithoutDepositRecord: pubs.length - pubsWithRecord.length,
			pubsWithoutRelease: pubsWithRecord.length - depositablePubs.length,
		},
	};
};

// ── Comparing a rebuilt deposit with the last one ──────────────────────────

type DepositShape = {
	type: string;
	doi: string | null;
	journalDoi: string | null;
	issue: string | null;
	issueDoi: string | null;
	url: string | null;
	title: string | null;
};

const describeIssue = (journalIssue) => {
	if (!journalIssue) return null;
	const volume = journalIssue.journal_volume?.volume;
	const parts = [
		volume && `volume ${volume}`,
		journalIssue.issue && `issue ${journalIssue.issue}`,
	];
	return parts.filter(Boolean).join(' ') || 'an issue with no number';
};

/** What a deposit registers, in terms we can compare and show to a person. */
export const describeDeposit = (deposit, target: 'pub' | 'collection'): DepositShape | null => {
	const body = deposit?.doi_batch?.body;
	if (!body || typeof body !== 'object') return null;
	const shape = (type: string, item, extra: Partial<DepositShape> = {}): DepositShape => ({
		type,
		doi: item?.doi_data?.doi ?? null,
		url: item?.doi_data?.resource?.['#text'] ?? item?.doi_data?.resource ?? null,
		title: item?.titles?.title == null ? null : JSON.stringify(item.titles.title),
		journalDoi: null,
		issue: null,
		issueDoi: null,
		...extra,
	});
	if (body.journal) {
		const { journal } = body;
		const extra = {
			journalDoi: journal.journal_metadata?.doi_data?.doi ?? null,
			issue: describeIssue(journal.journal_issue),
			issueDoi: journal.journal_issue?.doi_data?.doi ?? null,
		};
		if (target === 'pub') {
			return journal.journal_article
				? shape('journal article', journal.journal_article, extra)
				: shape('journal (no article)', null, extra);
		}
		return shape('journal issue', journal.journal_issue, extra);
	}
	if (body.book) {
		return target === 'pub'
			? shape('book chapter', body.book.content_item)
			: shape('book', body.book.book_metadata);
	}
	if (body.conference) {
		return target === 'pub'
			? shape('conference paper', body.conference.conference_paper)
			: shape('conference proceedings', body.conference.proceedings_metadata);
	}
	if (body.posted_content) return shape('preprint', body.posted_content);
	if (body.peer_review) return shape('peer review', body.peer_review);
	if (body.sa_component) {
		return shape('supplement', body.sa_component.component_list?.component);
	}
	return null;
};

const getPubDepositParams = (record) => {
	let contentVersion = getDepositRecordContentVersion(record);
	// Same rule as the AssignDoi dialog: a posted_content deposit with no version is a preprint.
	if (!contentVersion && isPreprintDeposit(record)) {
		contentVersion = 'preprint';
	}
	return {
		contentVersion: contentVersion || undefined,
		reviewType: getDepositRecordReviewType(record) || undefined,
		reviewRecommendation: getDepositRecordReviewRecommendation(record) || undefined,
	};
};

type Preflight =
	| { ok: false; reason: string }
	| {
			ok: true;
			params: Record<string, string | undefined>;
			target: 'pub' | 'collection';
			changes: string[];
			previousRecordId: string;
			previousDepositJson: object;
	  };

const skip = (reason: string): Preflight => ({ ok: false, reason });

/**
 * Reload the item, rebuild its deposit without sending it, and decide whether it is safe to send.
 * Runs right before each deposit, so edits made since the plan was built are respected.
 */
const preflightItem = async (
	communityId: string,
	item: RedepositItem,
	doiPrefix: string,
): Promise<Preflight> => {
	const target = item.kind;
	const model =
		target === 'pub'
			? await Pub.findByPk(item.id, {
					attributes: ['id', 'doi', 'crossrefDepositRecordId'],
					include: [
						depositRecordInclude,
						{ model: Release, as: 'releases', attributes: ['id'] },
					],
				})
			: await Collection.findByPk(item.id, {
					attributes: ['id', 'doi', 'crossrefDepositRecordId'],
					include: [depositRecordInclude],
				});
	if (!model) return skip('It no longer exists.');
	const record = model.crossrefDepositRecord?.toJSON() as any;
	if (!model.doi || !record) return skip('It no longer has a DOI deposited by PubPub.');
	if (model instanceof Pub && !model.releases?.length) return skip('It has no release.');

	const previous = describeDeposit(record.depositJson?.deposit, target);
	if (!previous)
		return skip("Its last deposit record isn't a Crossref deposit PubPub recognizes.");
	if (previous.doi && previous.doi !== model.doi) {
		return skip(
			`Its DOI (${model.doi}) doesn't match its last deposit (${previous.doi}). Check it from its DOI settings.`,
		);
	}
	if (!model.doi.startsWith(`${doiPrefix}/`)) {
		return skip(
			`Its DOI prefix doesn't match this community's Crossref prefix (${doiPrefix}), so Crossref would reject it.`,
		);
	}

	const params = target === 'pub' ? getPubDepositParams(record) : {};
	if (target === 'pub') {
		const issues = await validatePubRelationshipsForDeposit(item.id);
		if (issues.length) {
			return skip(
				`Its connections can't be deposited: ${issues.map((i) => i.message).join('; ')}`,
			);
		}
	}

	let rebuilt: { deposit: object; dois: { pub?: string; collection?: string } };
	try {
		rebuilt = await getDoiData(
			{
				communityId,
				collectionId: target === 'collection' ? item.id : undefined,
				pubId: target === 'pub' ? item.id : undefined,
				contentVersion: undefined,
				reviewType: undefined,
				reviewRecommendation: undefined,
				...params,
			},
			target,
		);
	} catch (err: any) {
		return skip(`Couldn't build the deposit: ${err?.message ?? err}`);
	}
	const next = describeDeposit(rebuilt.deposit, target);
	const nextDoi = target === 'pub' ? rebuilt.dois.pub : rebuilt.dois.collection;
	if (!next) return skip("The rebuilt deposit isn't one PubPub recognizes.");
	if (nextDoi !== model.doi) {
		return skip(
			`Its DOI would change from ${model.doi} to ${nextDoi}. This happens when a supplement connection was added or removed; redeposit it from its DOI settings if that's intended.`,
		);
	}
	if (next.type !== previous.type) {
		return skip(
			`It would change from a ${previous.type} to a ${next.type}, usually because its primary collection changed. Redeposit it from its DOI settings if that's intended.`,
		);
	}
	if (previous.journalDoi && next.journalDoi !== previous.journalDoi) {
		return skip(
			`Its journal DOI would change from ${previous.journalDoi} to ${next.journalDoi ?? 'none'}.`,
		);
	}
	if (target === 'pub' && previous.issue !== next.issue) {
		return skip(
			`Its issue would change from ${previous.issue ?? 'none'} to ${next.issue ?? 'none'}. Redeposit it from its DOI settings if that's intended.`,
		);
	}

	const live = await getCrossrefWork(model.doi);
	if (live.state === 'not_found') {
		return skip(
			`${model.doi} isn't registered in Crossref, so this isn't a redeposit. Deposit it from its DOI settings.`,
		);
	}
	if (live.state === 'error') {
		return skip(`Couldn't check its current Crossref record: ${live.message}`);
	}
	if (live.state === 'found') {
		const extra = findMetadataPubPubDoesNotSend(live.work);
		if (extra.length) {
			return skip(
				`Crossref has ${extra.join(', ')} for it, which PubPub doesn't send. Redepositing would remove them.`,
			);
		}
	}

	const changes = [
		previous.url !== next.url && `URL: ${previous.url} → ${next.url}`,
		previous.title !== next.title && `Title: ${previous.title} → ${next.title}`,
		previous.issueDoi !== next.issueDoi &&
			`Issue DOI: ${previous.issueDoi ?? 'none'} → ${next.issueDoi ?? 'none'}`,
		target === 'collection' &&
			previous.issue !== next.issue &&
			`Issue: ${previous.issue} → ${next.issue}`,
	].filter((change): change is string => Boolean(change));

	return {
		ok: true,
		params,
		target,
		changes,
		previousRecordId: record.id,
		previousDepositJson: record.depositJson,
	};
};

const sendItem = async (
	communityId: string,
	item: RedepositItem,
	doiPrefix: string,
	checkOnly: boolean,
): Promise<RedepositResult> => {
	const preflight = await preflightItem(communityId, item, doiPrefix);
	if (!preflight.ok) {
		return { ...item, status: 'skipped', message: preflight.reason };
	}
	const { params, target, changes, previousDepositJson } = preflight;
	if (checkOnly) {
		return { ...item, status: 'ready', changes };
	}
	// setDoiData overwrites the deposit record in place, so keep a copy we can restore from.
	const backup = await CrossrefDepositRecord.create({ depositJson: previousDepositJson });
	try {
		const { deposit } = await setDoiData(
			{
				communityId,
				collectionId: target === 'collection' ? item.id : undefined,
				pubId: target === 'pub' ? item.id : undefined,
				contentVersion: undefined,
				reviewType: undefined,
				reviewRecommendation: undefined,
				...params,
			},
			target,
		);
		const timestamp = (deposit as any).doi_batch?.head?.timestamp;
		return {
			...item,
			status: 'submitted',
			changes,
			submissionFile: getDepositFilename(deposit, timestamp),
			backupDepositRecordId: backup.id,
		};
	} catch (err: any) {
		await backup.destroy();
		return {
			...item,
			status: 'error',
			message: `Sending to Crossref failed: ${err?.message ?? err}`,
		};
	}
};

// ── Reading Crossref's submission log ───────────────────────────────────────

const statusRank = { Failure: 3, Warning: 2, Success: 1 };

/** The worst outcome among the DOIs in one submission (it can hold the issue and journal too). */
const summarizeSubmission = (
	item: RedepositItem,
	records: SubmissionRecord[],
): Pick<RedepositResult, 'status' | 'message'> => {
	if (!records.length) {
		return {
			status: 'failed',
			message: 'Crossref processed the file but reported no records.',
		};
	}
	const worst = [...records].sort(
		(a, b) => (statusRank[b.status] ?? 3) - (statusRank[a.status] ?? 3),
	)[0];
	const about = worst.doi && worst.doi !== item.doi ? ` (for ${worst.doi})` : '';
	if (worst.status === 'Success') {
		return { status: 'succeeded', message: worst.message };
	}
	if (worst.status === 'Warning') {
		return { status: 'warning', message: `Crossref: ${worst.message}${about}` };
	}
	return { status: 'failed', message: `Crossref: ${worst.message || worst.status}${about}` };
};

export type RedepositProgress = {
	phase: 'sending' | 'verifying';
	total: number;
	processed: number;
	current: RedepositItem | null;
	results: RedepositResult[];
};

type RunOptions = {
	/** Run every check and report what would be sent, without sending anything. */
	checkOnly?: boolean;
	onProgress?: (progress: RedepositProgress) => Promise<void> | void;
	shouldStop?: () => Promise<boolean> | boolean;
	/** How long to keep reading submission logs after the last send. */
	verifyForMs?: number;
	verifyIntervalMs?: number;
	sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const verifySubmissions = async (
	communityId: string,
	results: RedepositResult[],
	options: RunOptions,
) => {
	const {
		verifyForMs = 2 * 60 * 60 * 1000,
		verifyIntervalMs = 60_000,
		sleep = defaultSleep,
	} = options;
	const credentials = resolveCrossrefCredentials(
		(await getCommunityDepositTarget(communityId, true)) ?? null,
	);
	const deadline = Date.now() + verifyForMs;
	const lastError = new Map<RedepositResult, string>();
	let pending = results.filter((result) => result.status === 'submitted');
	let stopped = false;

	while (pending.length) {
		for (const result of pending) {
			// biome-ignore lint/performance/noAwaitInLoops: polite, sequential log reads
			const log = await fetchSubmissionResult(expect(result.submissionFile), credentials);
			if (log.state === 'completed') {
				Object.assign(result, summarizeSubmission(result, log.records));
			} else if (log.state === 'error') {
				lastError.set(result, log.message);
			}
		}
		pending = pending.filter((result) => result.status === 'submitted');
		await options.onProgress?.({
			phase: 'verifying',
			total: results.length,
			processed: results.length - pending.length,
			current: null,
			results,
		});
		if (!pending.length) break;
		if (options.shouldStop && (await options.shouldStop())) {
			stopped = true;
			break;
		}
		if (Date.now() + verifyIntervalMs > deadline) break;
		await sleep(verifyIntervalMs);
	}

	const minutes = Math.round(verifyForMs / 60_000);
	pending.forEach((result) => {
		const why = lastError.get(result);
		result.status = 'unverified';
		result.message = why
			? `Couldn't read Crossref's submission log (${why}). Check ${result.submissionFile} in Crossref's admin.`
			: `${stopped ? 'Stopped before' : `After ${minutes} minutes,`} Crossref hadn't finished processing ${result.submissionFile}. Check it in Crossref's admin.`;
	});
	return stopped;
};

/**
 * Checks and sends each item in order, one at a time, then reads Crossref's submission log for
 * everything sent. A skipped or failed item never stops the run. `shouldStop` is checked between
 * items and between rounds of log reads.
 */
export const runRedeposit = async (plan: RedepositPlan, options: RunOptions = {}) => {
	const { onProgress, shouldStop, checkOnly = false } = options;
	const communityId = plan.community.id;
	// A check-only run sends nothing, so it can run on a community that isn't approved for DOIs.
	if (!checkOnly) {
		await assertCommunityApprovedForDoi(communityId);
	}

	const results: RedepositResult[] = [];
	let stopped = false;

	for (const item of plan.items) {
		// biome-ignore lint/performance/noAwaitInLoops: deposits are sequential on purpose
		if (shouldStop && (await shouldStop())) {
			stopped = true;
			break;
		}
		let result: RedepositResult;
		try {
			result = await sendItem(communityId, item, plan.doiPrefix, checkOnly);
		} catch (err: any) {
			result = {
				...item,
				status: 'error',
				message: `Unexpected error: ${err?.message ?? err}`,
			};
		}
		results.push(result);
		await onProgress?.({
			phase: 'sending',
			total: plan.items.length,
			processed: results.length,
			current: item,
			results,
		});
	}

	if (results.some((result) => result.status === 'submitted')) {
		const stoppedVerifying = await verifySubmissions(communityId, results, options);
		stopped = stopped || stoppedVerifying;
	}

	const counts = results.reduce(
		(acc, result) => ({ ...acc, [result.status]: (acc[result.status] ?? 0) + 1 }),
		{} as Partial<Record<RedepositStatus, number>>,
	);
	return {
		total: plan.items.length,
		processed: results.length,
		notRun: plan.items.length - results.length,
		counts,
		stopped,
		results,
	};
};

export type RedepositSummary = Awaited<ReturnType<typeof runRedeposit>>;
