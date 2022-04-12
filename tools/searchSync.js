/* eslint-disable no-console */
import algoliasearch from 'algoliasearch';

import { asyncForEach } from 'utils/async';

import { Pub, Page } from '../server/models';
import { deletePubSearchData } from '../workers/tasks/search';
import { getPubSearchData, getPageSearchData } from '../workers/utils/searchUtils';

const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY);
const pubsIndex = client.initIndex('pubs');
const pagesIndex = client.initIndex('pages');

console.log('Beginning search sync');

const findAndIndexPubs = async (pubIds) => {
	await asyncForEach(pubIds, deletePubSearchData);
	const pubSyncData = await getPubSearchData(pubIds);
	console.log(`generated ${pubSyncData.length} entries for ${pubIds.length} Pubs`);
	return pubsIndex.saveObjects(pubSyncData, { autoGenerateObjectIDIfNotExist: true });
};

const findAndIndexPages = (pageIds) =>
	getPageSearchData(pageIds).then((pageSyncData) =>
		pagesIndex.saveObjects(pageSyncData, { autoGenerateObjectIDIfNotExist: true }),
	);

const batch = (array, count) => {
	const batches = [];
	while (array.length) {
		batches.push(
			array.splice(0, count).map((item) => {
				return item.id;
			}),
		);
	}
	return batches;
};

const syncPubs = async () => {
	console.log('syncing Pubs');
	const pubIds = await Pub.findAll({
		attributes: ['id'],
	});
	const pubBatches = batch(pubIds, 1);
	await Promise.each(pubBatches, (idArray, index) => {
		console.log(`syncing Pub batch ${index + 1} of ${pubBatches.length}`);
		return findAndIndexPubs(idArray).catch((err) => console.log('Sync error', err));
	});
};

const syncPages = async () => {
	const pageIds = await Page.findAll({
		attributes: ['id'],
	});
	const pageBatches = batch(pageIds, 100);
	return Promise.each(pageBatches, (idArray, index) => {
		console.log(`syncing Page batch ${index + 1} of ${pageBatches.length}`);
		return findAndIndexPages(idArray);
	});
};

const main = async () => {
	await syncPubs();
	await syncPages();
};

main();
