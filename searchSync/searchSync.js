/* eslint-disable no-console */
import Promise from 'bluebird';
import algoliasearch from 'algoliasearch';
import { Op } from 'sequelize';
import { Pub, Page } from '../server/models';
import { getPubSearchData, getPageSearchData } from '../workers/utils/searchUtils';

const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY);
const pubsIndex = client.initIndex('pubs');
const pagesIndex = client.initIndex('pages');

console.log('Beginning search sync');

let records = 0;
const findAndIndexPubs = (pubIds) => {
	return getPubSearchData(pubIds).then((pubSyncData) => {
		records += pubSyncData.length;
		return pubsIndex.saveObjects(pubSyncData, { autoGenerateObjectIDIfNotExist: true });
	});
};

const findAndIndexPages = (pageIds) => {
	return getPageSearchData(pageIds).then((pageSyncData) => {
		records += pageSyncData.length;
		return pagesIndex.saveObjects(pageSyncData, { autoGenerateObjectIDIfNotExist: true });
	});
};

new Promise((resolve) => {
	return resolve();
	// return reject('Fail-safe reject');
})
	.then(() => {
		return pubsIndex.setSettings({
			unretrievableAttributes: ['branchAccessIds', 'branchContent'],
			searchableAttributes: [
				'title',
				'description',
				'slug',
				'byline',
				'branchContent',
				'communityTitle',
				'communityDomain',
			],
			distinct: true,
			attributeForDistinct: 'pubId',
			attributesForFaceting: [
				'filterOnly(pubId)',
				'filterOnly(communityId)',
				'filterOnly(branchIsPublic)',
				'filterOnly(branchAccessIds)',
			],
		});
	})
	.then(() => {
		return Pub.findAll({
			attributes: ['id'],
			// limit: 10,
			where: {
				id: { [Op.ne]: '5dea7a72-330d-4fbf-8a88-c4723e201b39' },
			},
		});
	})
	.then((pubIds) => {
		const smallArrays = [];
		while (pubIds.length) {
			smallArrays.push(
				pubIds.splice(0, 100).map((item) => {
					return item.id;
				}),
			);
		}
		return Promise.each(smallArrays, (idArray, index) => {
			console.log('Starting pub batch ', index + 1, ' of ', smallArrays.length);
			return findAndIndexPubs(idArray);
		});
	})
	.then(() => {
		return pagesIndex.setSettings({
			unretrievableAttributes: ['pageAccessIds', 'content'],
			searchableAttributes: [
				'title',
				'description',
				'slug',
				'content',
				'communityTitle',
				'communityDomain',
			],
			distinct: true,
			attributeForDistinct: 'pageId',
			attributesForFaceting: [
				'filterOnly(isPublic)',
				'filterOnly(pageId)',
				'filterOnly(communityId)',
				'filterOnly(pageAccessIds)',
			],
		});
	})
	.then(() => {
		return Page.findAll({
			attributes: ['id'],
			// limit: 10,
		});
	})
	.then((pageIds) => {
		const smallArrays = [];
		while (pageIds.length) {
			smallArrays.push(
				pageIds.splice(0, 100).map((item) => {
					return item.id;
				}),
			);
		}
		return Promise.each(smallArrays, (idArray, index) => {
			console.log('Starting page batch ', index + 1, ' of ', smallArrays.length);
			return findAndIndexPages(idArray);
		});
	})
	.catch((err) => {
		console.log('Error with search sync', err);
	})
	.finally(() => {
		console.log('Num Pub Records: ', records);
		console.log('Ending search sync');
		process.exit();
	});
