import sanitizePub from './pubSanitize';
import sanitizeCollection from './collectionSanitize';

export default (initialData, overviewData) => {
	const sanitizedPubs = overviewData.pubs
		.map((pub) => {
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
			return sanitizePub(pub, initialData);
		})
		.filter((pub) => {
			return !!pub;
		});
	const sanitizedCollections = overviewData.collections
		.map((collection) => {
			return sanitizeCollection(collection, initialData);
		})
		.filter((collection) => {
			return !!collection;
		});

	return {
		...overviewData,
		pubs: sanitizedPubs,
		collections: sanitizedCollections,
	};
};
