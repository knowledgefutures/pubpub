import type { DepositState } from 'server/crossrefDepositRecord/queries';

import {
	createCrossrefDepositRecord,
	updateCrossrefDepositRecord,
} from 'server/crossrefDepositRecord/queries';
import { getCommunityDepositTarget } from 'server/depositTarget/queries';
import {
	DoilyUnsupportedRecordError,
	findPrimaryDoilyRecord,
	isDoilyEnabledForCommunity,
	submitDepositViaDoily,
} from 'server/doily/client';
import {
	Collection,
	CollectionAttribution,
	CollectionPub,
	Community,
	includeUserModel,
	Pub,
} from 'server/models';
import buildPubOptions from 'server/utils/queryHelpers/pubOptions';
import { expect } from 'utils/assert';
import { getPrimaryCollectionPub } from 'utils/collections/primary';
import createDeposit, { getDois } from 'utils/crossref/createDeposit';
import { isDepositStatus } from 'utils/crossref/depositStatus';

import { submitDoiData } from './submit';

const collectionIncludes = [
	{
		model: CollectionAttribution,
		as: 'attributions',
		include: [includeUserModel({ as: 'user', required: false })],
	},
];

const findPrimaryCollectionPubForPub = async (pubId: string) => {
	const collectionPubs = await CollectionPub.findAll({
		where: { pubId },
		include: [
			{
				model: Collection,
				as: 'collection',
				include: collectionIncludes,
			},
		],
	});
	return getPrimaryCollectionPub(collectionPubs);
};

export const findCollection = (collectionId) =>
	Collection.findOne({ where: { id: collectionId }, include: collectionIncludes });

export const findPub = (pubId) =>
	Pub.findOne({
		where: { id: pubId },
		...buildPubOptions({
			getEdgesOptions: {
				includeTargetPub: true,
				// Include Pub for both inbound and outbound pub connections
				// since we do a lot of downstream processing with pubEdges.
				includePub: true,
				includeCommunityForPubs: true,
			},
		}),
	});

const findCommunity = (communityId) =>
	Community.findOne({
		where: { id: communityId },
		attributes: [
			'id',
			'title',
			'issn',
			'domain',
			'subdomain',
			'citeAs',
			'publishAs',
			// cmsMode gates canonicalCommunityUrl, so it must be selected here or
			// deposits fall back to the pubpub.org URL for CMS-mode communities.
			'cmsMode',
			'canonicalBaseUrl',
			'canonicalPubUrlTemplate',
		],
	});

export const persistCrossrefDepositRecord = async (
	ids,
	depositJson,
	depositState: DepositState = {},
) => {
	const { collectionId, pubId } = ids;
	const targetModel = expect(
		pubId
			? await Pub.findOne({
					where: {
						id: pubId,
					},
				})
			: await Collection.findOne({
					where: {
						id: collectionId,
					},
				}),
	);
	const { crossrefDepositRecordId } = targetModel;

	if (crossrefDepositRecordId) {
		return updateCrossrefDepositRecord({
			crossrefDepositRecordId,
			depositJson,
			...depositState,
		});
	}

	const crossrefDepositRecord = await createCrossrefDepositRecord({
		depositJson,
		...depositState,
	});

	// this is just to make typescript happy, update cannot be called on the union
	await (targetModel as Pub).update({
		crossrefDepositRecordId: crossrefDepositRecord.id,
	});

	return targetModel;
};

export const persistDoiData = (ids, dois) => {
	const { collectionId, pubId } = ids;
	const { collection: collectionDoi, pub: pubDoi } = dois;
	const updates = [];
	if (collectionId && collectionDoi) {
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
		updates.push(Collection.update({ doi: collectionDoi }, { where: { id: collectionId } }));
	}
	if (pubId && pubDoi) {
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
		updates.push(Pub.update({ doi: pubDoi }, { where: { id: pubId } }));
	}
	return Promise.all(updates);
};

export const getDoiData = (
	{ communityId, collectionId, pubId, contentVersion, reviewType, reviewRecommendation },
	doiTarget,
	timestamp = new Date().getTime(),
	includeRelationships = true,
) =>
	Promise.all([
		findCommunity(communityId),
		collectionId && findCollection(collectionId),
		pubId && findPrimaryCollectionPubForPub(pubId),
		pubId && findPub(pubId),
		getCommunityDepositTarget(communityId, true),
	]).then(([community, collection, collectionPub, pub, depositTarget]) => {
		const resolvedCollection = collectionPub ? collectionPub.collection : collection;
		return createDeposit(
			{
				collectionPub,
				collection: resolvedCollection?.toJSON(),
				community: community?.toJSON(),
				pub: pub?.toJSON(),
				contentVersion,
				reviewType,
				reviewRecommendation,
			},
			doiTarget,
			depositTarget,
			timestamp,
			includeRelationships,
		);
	});

export const setDoiData = async (
	{ communityId, collectionId, pubId, contentVersion, reviewType, reviewRecommendation },
	doiTarget,
) => {
	const depositParams = {
		communityId,
		collectionId,
		pubId,
		contentVersion,
		reviewType,
		reviewRecommendation,
	};

	const ids = { collectionId, pubId };
	const isDoilyEnabled = await isDoilyEnabledForCommunity(communityId);

	// Doily path (community feature flag `doilyDeposits`): build the deposit
	// JSON as usual, but hand registration to Doily, which maps it to Crossref
	// 5.4.0, versions it, and owns result polling. One shot — Doily's
	// prechecks replace the two-phase relationship dance below. Record types
	// Doily rejects (conference, supplement) fall through to the legacy path;
	// any other Doily failure is a real failure (see server/doily/client.ts
	// for why falling back would silently strand the DOI's metadata).
	if (isDoilyEnabled) {
		const timestamp = new Date().getTime();
		const depositJson = await getDoiData(depositParams, doiTarget, timestamp);
		const { deposit, dois } = depositJson;
		try {
			const primaryDoi = expect(dois.pub ?? dois.collection ?? dois.community);
			const doilyResult = await submitDepositViaDoily({
				communityId,
				depositJson,
				primaryDoi,
			});
			// Doily's answer is the deposit's opening state, not its outcome:
			// Crossref accepts a batch and rules on it minutes to hours later.
			// Lift the parts we act on into columns (the whole response stays in
			// the blob for audit) so the webhook in server/doily/webhook.ts has
			// a row to find and the UI has a status to read.
			const primaryRecord = findPrimaryDoilyRecord(doilyResult.records, primaryDoi);
			await Promise.all([
				persistDoiData(ids, dois),
				persistCrossrefDepositRecord(
					ids,
					{ ...depositJson, doily: doilyResult },
					{
						status: isDepositStatus(primaryRecord?.status)
							? primaryRecord.status
							: null,
						doilyDepositId: primaryRecord?.depositId ?? null,
						doi: primaryRecord?.doi ?? primaryDoi,
						// Cleared, not left: an error from the attempt before this
						// one would otherwise sit next to a deposit that has just
						// been accepted.
						error: null,
						lastCheckedAt: new Date(),
					},
				),
			]);
			return { deposit, dois };
		} catch (error) {
			if (!(error instanceof DoilyUnsupportedRecordError)) {
				throw error;
			}
			// fall through to the legacy pipeline below
		}
	}

	// peer reviews in crossref require a rel:program with isReviewOf relation,
	// so we cannot do the two-phase deposit (disconnect then connect) that we
	// use for other content types. for peer reviews, just submit once.
	if (reviewType) {
		const timestamp = new Date().getTime();
		const depositJson = await getDoiData(depositParams, doiTarget, timestamp);
		const { deposit, dois } = depositJson;
		await submitDoiData(deposit, timestamp, communityId);
		await Promise.all([
			persistDoiData(ids, dois),
			persistCrossrefDepositRecord(ids, depositJson),
		]);
		return { deposit, dois };
	}

	// Crossref requires us to first delete any existing relationships (by
	// submitting a deposit without them), and then submit a deposit with the
	// updated relationships. The second deposit must have a newer timestamp.
	// Disclaimer: some of the code here is fairly explicit because juggling two
	// sets of deposits and timestamps has proven tricky to maintain.
	const timestampDisconnected = new Date().getTime();
	const timestampConnected = timestampDisconnected + 1;
	// (1) Create the disconnected deposit.
	const { deposit: depositDisconnected } = await getDoiData(
		depositParams,
		doiTarget,
		timestampDisconnected,
		false, // Exclude relationships (connections).
	);
	// (2) Submit the disconnected deposit.
	await submitDoiData(depositDisconnected, timestampDisconnected, communityId);
	// (3) Create the connected deposit.
	const depositJson = await getDoiData(depositParams, doiTarget, timestampConnected);
	const { deposit: depositConnected, dois } = depositJson;
	// (4) Submit the connected deposit.
	await submitDoiData(depositConnected, timestampConnected, communityId);
	// (5) Store the DOIs and Crossref deposit record.
	await Promise.all([persistDoiData(ids, dois), persistCrossrefDepositRecord(ids, depositJson)]);
	return { deposit: depositConnected, dois };
};

export const generateDoi = async ({ communityId, collectionId, pubId }, target) => {
	const [community, collection, pub, depositTarget] = await Promise.all([
		findCommunity(communityId),
		collectionId && findCollection(collectionId),
		pubId && findPub(pubId),
		getCommunityDepositTarget(communityId),
	]);

	return getDois(
		{
			pub,
			community,
			collection,
		},
		target,
		depositTarget,
	);
};
