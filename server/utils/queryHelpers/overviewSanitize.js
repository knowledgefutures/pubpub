import sanitizePub from './pubSanitize';
import sanitizeCollection from './collectionSanitize';

export default (initialData, overviewData) => {
	const sanitizedPubs = overviewData.pubs
		.map((pub) => {
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
