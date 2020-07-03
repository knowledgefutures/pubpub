import createDeposit from 'utils/crossref/createDeposit';
import {
	Collection,
	CollectionAttribution,
	CollectionPub,
	Community,
	Pub,
	PubAttribution,
	Release,
	includeUserModel,
} from 'server/models';

import { submitDoiData } from './submit';

const collectionIncludes = [
	{
		model: CollectionAttribution,
		as: 'attributions',
		include: [includeUserModel({ as: 'user', required: false })],
	},
];

const findPrimaryCollectionPubForPub = (pubId) =>
	CollectionPub.findOne({
		where: { pubId: pubId, isPrimary: true },
		include: [
			{
				model: Collection,
				as: 'collection',
				include: collectionIncludes,
			},
		],
	});

const findCollection = (collectionId) =>
	Collection.findOne({ where: { id: collectionId }, include: collectionIncludes });

const findPub = (pubId) =>
	Pub.findOne({
		where: { id: pubId },
		include: [
			{ model: Release, as: 'releases' },
			{
				model: PubAttribution,
				as: 'attributions',
				include: [includeUserModel({ as: 'user' })],
			},
		],
	});

const findCommunity = (communityId) =>
	Community.findOne({
		where: { id: communityId },
		attributes: ['id', 'title', 'issn', 'domain', 'subdomain'],
	});

const persistDoiData = (ids, dois) => {
	const { collectionId, pubId } = ids;
	const { collection: collectionDoi, pub: pubDoi } = dois;
	const updates = [];
	if (collectionId && collectionDoi) {
		updates.push(Collection.update({ doi: collectionDoi }, { where: { id: collectionId } }));
	}
	if (pubId && pubDoi) {
		updates.push(Pub.update({ doi: pubDoi }, { where: { id: pubId } }));
	}
	return Promise.all(updates);
};

export const getDoiData = ({ communityId, collectionId, pubId }, doiTarget) =>
	Promise.all([
		findCommunity(communityId),
		collectionId && findCollection(collectionId),
		pubId && findPrimaryCollectionPubForPub(pubId),
		pubId && findPub(pubId),
	]).then(([community, collection, collectionPub, pub]) => {
		const resolvedCollection = collectionPub ? collectionPub.collection : collection;
		return createDeposit(
			{
				collectionPub: collectionPub,
				collection: resolvedCollection,
				community: community,
				pub: pub,
			},
			doiTarget,
		);
	});

export const setDoiData = ({ communityId, collectionId, pubId }, doiTarget) =>
	getDoiData(
		{ communityId: communityId, collectionId: collectionId, pubId: pubId },
		doiTarget,
	).then(({ deposit, timestamp, dois }) =>
		submitDoiData(deposit, timestamp, communityId)
			.then(() => persistDoiData({ collectionId: collectionId, pubId: pubId }, dois))
			.then(() => {
				return { deposit: deposit, dois: dois };
			}),
	);
