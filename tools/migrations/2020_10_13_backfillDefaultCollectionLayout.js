import { asyncMap } from 'utils/async';

import { generateDefaultCollectionLayout } from 'server/collection/queries';

module.exports = async ({ models }) => {
	const { Collection } = models;
	await asyncMap(
		await Collection.findAll(),
		(collection) => {
			collection.layout = generateDefaultCollectionLayout();
			return collection.save();
		},
		{ concurrency: 100 },
	);
};
