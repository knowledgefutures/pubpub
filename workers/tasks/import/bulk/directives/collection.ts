import { createCollection } from 'server/collection/queries';
import { Collection, CollectionAttribution } from 'server/models';

import { BulkImportError } from '../errors';
import { getAttributionAttributes } from './util';

const createCollectionAttributions = async (collection, directive) => {
	const { attributions } = directive;
	if (!attributions) {
		return;
	}
	await Promise.all(
		attributions.map(async (attrDirective, index, { length }) => {
			const resolvedAttrs = await getAttributionAttributes(attrDirective);
			return CollectionAttribution.create({
				collectionId: collection.id,
				order: 1 / 2 ** (length - index),
				...resolvedAttrs,
			});
		}),
	);
};

const findOrCreateCollection = async (directive, community) => {
	if (directive.create) {
		return createCollection({
			communityId: community.id,
			title: directive.title || directive.$meta.name,
			kind: directive.kind || 'tag',
			doi: directive.doi || null,
		});
	}
	const foundCollection = await Collection.findOne({ where: { slug: directive.slug } });
	if (!foundCollection) {
		throw new BulkImportError(
			{ directive: directive },
			`No existing Collection with slug ${directive.slug}. If you meant to create one, use "create: true"`,
		);
	}
	return foundCollection;
};

export const resolveCollectionDirective = async ({ directive, community }) => {
	const collection = await findOrCreateCollection(directive, community);
	await createCollectionAttributions(collection, directive);

	return {
		collection: collection,
		created: directive.create,
	};
};
