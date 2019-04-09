import { deserializeMetadata } from 'shared/collections/metadata';
import { collectionUrl } from 'shared/util/canonicalUrls';

import transformAttributions from './attributions';

const transformMetadata = (metadata, kind) =>
	deserializeMetadata({
		metadata: metadata,
		kind: kind,
		fallback: (field) => {
			const { type } = field;
			if (type && type.name === 'date') {
				return new Date();
			}
			return undefined;
		},
	});

export default ({ globals, community }) => (collection) => {
	const { title, metadata, attributions } = collection;
	return {
		...transformMetadata(metadata, collection.kind),
		url: collectionUrl(community, collection),
		title: title,
		timestamp: globals.timestamp,
		attributions: transformAttributions(attributions),
		doi: globals.dois.collection,
	};
};
