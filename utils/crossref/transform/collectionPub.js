import { getSchemaForKind } from 'utils/collections/schemas';

const getComponentTypeForCollectionPub = (collectionPub) => {
	const { contextHints } = getSchemaForKind(collectionPub.collection.kind);
	const contextHint =
		contextHints.find((ch) => ch.value === collectionPub.contextHint) ||
		contextHints.find((ch) => ch.isDefault);
	return (contextHint && contextHint.crossrefComponentType) || 'section';
};

export default (collectionPub) => ({
	componentType: getComponentTypeForCollectionPub(collectionPub),
});
