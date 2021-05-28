/* eslint-disable no-console */
import Bluebird from 'bluebird';

import { Community, Collection, CollectionPub } from 'server/models';
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
	const collectionPubs = await CollectionPub.findAll({ where: { collectionId: collection.id } });
	console.log(`=== Will deposit 1 Collection and ${collectionPubs.length} Pubs`);
	await setAndLogDoiData(
		{ communityId: community.id, collectionId: collection.id },
		'collection',
	);
	await Bluebird.map(
		collectionPubs.map((cp) => cp.pubId),
		(pubId) =>
			setAndLogDoiData(
				{ communityId: community.id, collectionId: collection.id, pubId },
				'pub',
			),
		{ concurrency: 1 },
	);
};

main();
