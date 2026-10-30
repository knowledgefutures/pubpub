import { Op } from 'sequelize';

import { getCommunityDepositTarget } from 'server/depositTarget/queries';
import { Collection, Community, CrossrefDepositRecord, Pub, Release } from 'server/models';
import { expect } from 'utils/assert';
import {
	getDepositRecordContentVersion,
	getDepositRecordReviewRecommendation,
	getDepositRecordReviewType,
	isPreprintDeposit,
} from 'utils/crossref/parseDeposit';
import normalizeIssn from 'utils/crossref/transform/issn';

import { assertCommunityApprovedForDoi } from './permissions';
import { setDoiData } from './queries';

/**
 * Redeposits a community's existing DOIs with Crossref, rebuilding each deposit from current data.
 * Used when a fix to the deposit code needs to reach records that were deposited before it. Only
 * targets that PubPub deposited itself (they have a CrossrefDepositRecord) are included, and each
 * pub keeps the content version and review settings from its last deposit.
 */

export type RedepositItem = {
	kind: 'collection' | 'pub';
	id: string;
	title: string;
	slug: string;
	doi: string;
	contentVersion?: string;
	reviewType?: string;
	reviewRecommendation?: string;
};

export type RedepositResult = Pick<RedepositItem, 'kind' | 'id' | 'title' | 'slug' | 'doi'> & {
	ok: boolean;
	error?: string;
};

export type RedepositOptions = {
	/** Deposit only this pub (by slug). Collections are skipped. */
	pubSlug?: string;
	/** Deposit only the first N pubs. Collections are skipped. */
	limit?: number;
};

export type RedepositPlan = {
	community: { id: string; title: string; subdomain: string; issn: string | null };
	doiPrefix: string | null;
	items: RedepositItem[];
	skipped: {
		/** Pubs with a DOI but no deposit record, so we can't tell PubPub registered them. */
		pubsWithoutDepositRecord: number;
		/** Pubs with a deposit record but no release; the deposit API refuses these. */
		pubsWithoutRelease: number;
	};
};

const depositRecordInclude = {
	model: CrossrefDepositRecord,
	as: 'crossrefDepositRecord',
	attributes: ['id', 'depositJson'],
};

const getPubDepositParams = (depositRecord) => {
	const record = depositRecord?.toJSON?.() ?? depositRecord;
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

export const getRedepositPlan = async (
	communityId: string,
	options: RedepositOptions = {},
): Promise<RedepositPlan> => {
	const { pubSlug, limit } = options;
	const isPartial = Boolean(pubSlug || limit);
	const [community, depositTarget] = await Promise.all([
		Community.findByPk(communityId, { attributes: ['id', 'title', 'subdomain', 'issn'] }),
		getCommunityDepositTarget(communityId),
	]);
	const { title, subdomain, issn } = expect(community);

	const collections = isPartial
		? []
		: await Collection.findAll({
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
			});

	const pubs = await Pub.findAll({
		where: {
			communityId,
			doi: { [Op.ne]: null },
			...(pubSlug && { slug: pubSlug }),
		},
		attributes: ['id', 'title', 'slug', 'doi', 'crossrefDepositRecordId'],
		include: [depositRecordInclude, { model: Release, as: 'releases', attributes: ['id'] }],
		order: [
			['createdAt', 'ASC'],
			['id', 'ASC'],
		],
	});

	const pubsWithRecord = pubs.filter((pub) => pub.crossrefDepositRecordId);
	const depositablePubs = pubsWithRecord.filter((pub) => pub.releases?.length);
	const selectedPubs = limit ? depositablePubs.slice(0, limit) : depositablePubs;

	return {
		community: { id: communityId, title, subdomain, issn: normalizeIssn(issn) },
		doiPrefix: depositTarget?.doiPrefix ?? null,
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
					...getPubDepositParams(pub.crossrefDepositRecord),
				}),
			),
		],
		skipped: {
			pubsWithoutDepositRecord: pubs.length - pubsWithRecord.length,
			pubsWithoutRelease: pubsWithRecord.length - depositablePubs.length,
		},
	};
};

const depositItem = (communityId: string, item: RedepositItem) => {
	const params = {
		communityId,
		collectionId: undefined,
		pubId: undefined,
		contentVersion: undefined,
		reviewType: undefined,
		reviewRecommendation: undefined,
	};
	if (item.kind === 'collection') {
		return setDoiData({ ...params, collectionId: item.id }, 'collection');
	}
	const { id: pubId, contentVersion, reviewType, reviewRecommendation } = item;
	return setDoiData(
		{ ...params, pubId, contentVersion, reviewType, reviewRecommendation },
		'pub',
	);
};

export type RedepositProgress = {
	total: number;
	processed: number;
	failed: number;
	current: RedepositItem | null;
};

/**
 * Deposits each item in order, one at a time, to stay well inside Crossref's rate limits. A failed
 * item is recorded and the run continues. `shouldStop` is checked before each item.
 */
export const runRedeposit = async (
	plan: RedepositPlan,
	{
		onProgress,
		shouldStop,
	}: {
		onProgress?: (progress: RedepositProgress, result: RedepositResult) => Promise<void> | void;
		shouldStop?: () => Promise<boolean> | boolean;
	} = {},
) => {
	const communityId = plan.community.id;
	await assertCommunityApprovedForDoi(communityId);

	const results: RedepositResult[] = [];
	let failed = 0;
	let stopped = false;

	for (const item of plan.items) {
		// biome-ignore lint/performance/noAwaitInLoops: deposits are sequential on purpose
		if (shouldStop && (await shouldStop())) {
			stopped = true;
			break;
		}
		const { kind, id, title, slug, doi } = item;
		let result: RedepositResult;
		try {
			await depositItem(communityId, item);
			result = { kind, id, title, slug, doi, ok: true };
		} catch (err: any) {
			failed += 1;
			result = { kind, id, title, slug, doi, ok: false, error: String(err?.message ?? err) };
		}
		results.push(result);
		await onProgress?.(
			{ total: plan.items.length, processed: results.length, failed, current: item },
			result,
		);
	}

	return {
		total: plan.items.length,
		processed: results.length,
		succeeded: results.length - failed,
		failed,
		stopped,
		results,
	};
};

export type RedepositSummary = Awaited<ReturnType<typeof runRedeposit>>;
