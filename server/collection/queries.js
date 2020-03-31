import { normalizeMetadataToKind } from 'shared/collections/metadata';
import { slugifyString, generateHash } from 'utils';
import { Collection, CollectionPub, Community } from '../models';

export const createCollection = (inputValues) => {
	return Community.findOne({ where: { id: inputValues.communityId } }).then((community) => {
		const title = inputValues.title.trim();
		const collection = {
			title: title,
			slug: slugifyString(title),
			isRestricted: true,
			isPublic: true,
			viewHash: generateHash(8),
			editHash: generateHash(8),
			communityId: inputValues.communityId,
			kind: inputValues.kind,
		};
		const metadata = normalizeMetadataToKind({}, inputValues.kind, {
			community: community,
			collection: collection,
		});
		return Collection.create({ ...collection, metadata: metadata }, { returning: true });
	});
};

export const updateCollection = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return Collection.update(filteredValues, {
		where: { id: inputValues.collectionId },
	})
		.then(() => {
			if (filteredValues.isPublic === false) {
				return CollectionPub.update(
					{ isPrimary: false },
					{ where: { isPrimary: true, collectionId: inputValues.collectionId } },
				);
			}
			return null;
		})
		.then(() => {
			return filteredValues;
		});
};

export const destroyCollection = (inputValues) => {
	return Collection.destroy({
		where: { id: inputValues.collectionId },
	});
};
