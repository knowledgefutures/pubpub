export const getPubPageContextTitle = (pubData, communityData) => {
	const primaryCollection = pubData.collectionPubs.reduce((prev, curr) => {
		if (curr.isPrimary && curr.collection.kind !== 'issue') {
			return curr;
		}
		return prev;
	}, {});
	return primaryCollection.title || communityData.title;
};

export const getPubPageTitle = (pubData, communityData) => {
	const { title } = pubData;
	const contextTitle = getPubPageContextTitle(pubData, communityData);
	return `${title} · ${contextTitle}`;
};
