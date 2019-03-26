/**
 * Helper functions for interacting with Collection models
 */
import { Community, Collection } from '../../models';
import { normalizeMetadataToKind } from '../../../shared/collections/metadata';
import withPermissions from '../permissions/withPermissions';

const createCollection = (title, kind, communityId) => {
	return Community.findOne({ where: { id: communityId } }).then((community) => {
		const collection = {
			title: title.trim(),
			isRestricted: true,
			isPublic: true,
			communityId: communityId,
			kind: kind,
		};
		const metadata = normalizeMetadataToKind({}, kind, {
			community: community,
			collection: collection,
		});
		return Collection.create({ ...collection, metadata: metadata }, { returning: true });
	});
};

const updateCollection = (collectionId, updateRequest) => {
	const updatedCollection = {};
	Object.keys(updateRequest).forEach((key) => {
		if (['title', 'isRestricted', 'isPublic', 'pageId', 'metadata'].indexOf(key) > -1) {
			updatedCollection[key] = updateRequest[key];
		}
	});
	return Collection.update(updatedCollection, {
		where: { id: collectionId },
		returning: true,
	});
};

const destroyCollection = (collectionId) =>
	Collection.destroy({
		where: { id: collectionId },
	});

export default withPermissions({
	createCollection: createCollection,
	updateCollection: updateCollection,
	destroyCollection: destroyCollection,
});
