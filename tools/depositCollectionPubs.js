/* eslint-disable no-console */
import { asyncMap } from 'utils/async';
import { Community, Collection, CollectionPub, Pub, Release } from 'server/models';
import { setDoiData } from 'server/doi/queries';

const {
	argv: { community: communitySubdomain, collection: collectionSlug },
} = require('yargs');

const setAndLogDoiData = async ({ communityId, collectionId, pubId }, target) => {
	const result = await setDoiData({ communityId, collectionId, pubId }, target);
	console.log('Set DOI data for', { communityId, collectionId, pubId }, 'with target', target);
	console.log(result);
};

const main = async () => {
	const community = await Community.findOne({ where: { subdomain: communitySubdomain } });
	const collection = await Collection.findOne({
		where: { communityId: community.id, slug: collectionSlug },
	});
	const collectionId = collection.id;
	const collectionPubs = await CollectionPub.findAll({
		where: { collectionId },
		include: [
			{
				model: Pub,
				as: 'pub',
				include: [
					{
						model: Release,
						as: 'releases',
						attributes: ['id'],
					},
				],
			},
		],
	});
	const releasedCollectionPubs = collectionPubs.filter((cp) => cp.pub.releases.length > 0);

	console.log(`=== Will deposit 1 Collection and ${releasedCollectionPubs.length} Pubs`);
	await setAndLogDoiData(
		{ communityId: community.id, collectionId: collection.id },
		'collection',
	);
	await asyncMap(
		releasedCollectionPubs.map((cp) => cp.pubId),
		(pubId) =>
			setAndLogDoiData(
				{ communityId: community.id, collectionId: collection.id, pubId },
				'pub',
			),
		{ concurrency: 1 },
	);
};

main();
