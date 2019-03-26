import { CollectionPub } from '../../models';
import withPermissions from '../permissions/withPermissions';

const CAN_UPDATE_ATTRIBUTES = ['rank', 'contextHint'];

const createCollectionPub = (pubId, collectionId, rank) =>
	CollectionPub.create(
		{ collectionId: collectionId, pubId: pubId, rank: rank },
		{ returning: true },
	);

const updateCollectionPub = (id, updateRequest) => {
	const update = {};
	Object.keys(updateRequest).forEach((key) => {
		if (CAN_UPDATE_ATTRIBUTES.includes(key)) {
			update[key] = updateRequest[key];
		}
	});
	return CollectionPub.update(update, { where: { id: id }, returning: true });
};

const destroyCollectionPub = (id) => CollectionPub.destroy({ where: { id: id } });

export default withPermissions({
	createCollectionPub: createCollectionPub,
	updateCollectionPub: updateCollectionPub,
	destroyCollectionPub: destroyCollectionPub,
});
