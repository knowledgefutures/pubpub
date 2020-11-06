import Bluebird from 'bluebird';

import { generateDefaultCollectionLayout } from 'server/collection/queries';

module.exports = async ({ models }) => {
	const { Collection } = models;
	await Bluebird.map(
		await Collection.findAll(),
		(collection) => {
			collection.layout = generateDefaultCollectionLayout();
			return collection.save();
		},
		{ concurrency: 100 },
	);
};
