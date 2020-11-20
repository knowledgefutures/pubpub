import { getPrimaryCollection } from 'utils/collections/primary';

export const getPubPageContextTitle = (pubData, communityData) => {
	const primaryCollection = getPrimaryCollection(pubData.collectionPubs);
	if (primaryCollection) {
		return primaryCollection.title;
	}
	return communityData.title;
};

export const getPubPageTitle = (pubData, communityData) => {
	const { title } = pubData;
	const contextTitle = getPubPageContextTitle(pubData, communityData);
	return `${title} · ${contextTitle}`;
};
