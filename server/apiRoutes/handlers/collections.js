/**
 * Helper functions for interacting with Collection models
 */
import { normalizeMetadataToKind } from 'shared/collections/metadata';
import { Community, Collection, CollectionPub } from '../../models';
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
	return Collection.findOne({ where: { id: collectionId } }).then((collection) => {
		return Promise.all([
			collection.update(updatedCollection),
			collection.isPublic &&
				updateRequest.isPublic === false &&
				CollectionPub.update(
					{ isPrimary: false },
					{ where: { isPrimary: true, collectionId: collection.id } },
				),
		]);
	});
};

const destroyCollection = (collectionId) => Collection.destroy({ where: { id: collectionId } });

export default withPermissions({
	createCollection: createCollection,
	updateCollection: updateCollection,
	destroyCollection: destroyCollection,
});
