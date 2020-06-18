import { collectionUrl } from 'utils/canonicalUrls';
import { deserializeMetadata } from 'utils/collections/metadata';

import transformAttributions from './attributions';

const transformMetadata = (metadata, kind, timestamp) =>
	deserializeMetadata({
		metadata: metadata,
		kind: kind,
		fallback: (field) => {
			const { type } = field;
			// If the field is a date, but it isn't provided, use the global timestamp
			// (which is likely to be the current time)
			if (type && type.name === 'date') {
				return new Date(timestamp);
			}
			return undefined;
		},
	});

export default ({ globals, community }) => (collection) => {
	const { title, metadata, attributions } = collection;
	return {
		url: collectionUrl(community, collection),
		...transformMetadata(metadata, collection.kind, globals.timestamp),
		title: title,
		timestamp: globals.timestamp,
		attributions: transformAttributions(attributions),
		doi: globals.dois.collection,
	};
};
