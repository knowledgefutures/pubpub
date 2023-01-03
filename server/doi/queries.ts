import createDeposit, { getDois } from 'utils/crossref/createDeposit';
import {
	Collection,
	CollectionAttribution,
	CollectionPub,
	Community,
	Pub,
	includeUserModel,
} from 'server/models';
import buildPubOptions from 'server/utils/queryHelpers/pubOptions';
import {
	createCrossrefDepositRecord,
	updateCrossrefDepositRecord,
} from 'server/crossrefDepositRecord/queries';
import { getPrimaryCollectionPub } from 'utils/collections/primary';
import { getCommunityDepositTarget } from 'server/depositTarget/queries';

import { submitDoiData } from './submit';

const collectionIncludes = [
	{
		model: CollectionAttribution,
		as: 'attributions',
		include: [includeUserModel({ as: 'user', required: false })],
	},
];

const findPrimaryCollectionPubForPub = async (pubId) => {
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

const findCollection = (collectionId) =>
	Collection.findOne({ where: { id: collectionId }, include: collectionIncludes });

const findPub = (pubId) =>
	Pub.findOne({
		where: { id: pubId },
		...buildPubOptions({
			getEdgesOptions: {
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
		attributes: ['id', 'title', 'issn', 'domain', 'subdomain', 'citeAs', 'publishAs'],
	});

const persistCrossrefDepositRecord = async (ids, depositJson) => {
	const { collectionId, pubId } = ids;
	const targetModel = pubId
		? await Pub.findOne({
				where: {
					id: pubId,
				},
		  })
		: await Collection.findOne({
				where: {
					id: collectionId,
				},
		  });
	const { crossrefDepositRecordId } = targetModel;

	if (crossrefDepositRecordId) {
		return updateCrossrefDepositRecord({
			crossrefDepositRecordId,
			depositJson,
		});
	}

	const crossrefDepositRecord = await createCrossrefDepositRecord({ depositJson });

	await targetModel.update({
		crossrefDepositRecordId: crossrefDepositRecord.id,
	});

	return targetModel;
};

const persistDoiData = (ids, dois) => {
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
				community: community.toJSON(),
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
	const ids = { collectionId, pubId };
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
