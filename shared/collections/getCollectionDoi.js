export default (collection) => {
	if (collection.doi) {
		return collection.doi;
	}
	return collection.metadata && collection.metadata.doi;
};
