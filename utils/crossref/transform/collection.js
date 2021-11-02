import { collectionUrl } from 'utils/canonicalUrls';
import { deserializeMetadata } from 'utils/collections/metadata';

import transformAttributions from './attributions';

const transformMetadata = (metadata, collection) =>
	deserializeMetadata({
		metadata,
		kind: collection.kind,
		fallback: (field) => {
			const { type } = field;
			if (type && type.name === 'date') {
				return new Date(collection.createdAt);
			}
			return undefined;
		},
	});

export default ({ globals, community }) =>
	(collection) => {
		const { timestamp, dois, contentVersion } = globals;
		const { title, metadata, attributions } = collection;
		const { publishAs } = community;
		return {
			url: collectionUrl(community, collection),
			...transformMetadata(metadata, collection, globals.timestamp),
			title,
			timestamp,
			attributions: transformAttributions(attributions),
			doi: dois.collection,
			contentVersion,
			publishAs,
		};
	};
