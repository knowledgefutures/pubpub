import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';

const orderedContributors = (contributors) =>
	contributors.concat().sort((a, b) => {
		if (a.order !== b.order) {
			return a.order - b.order;
		}
		return b.createdAt - a.createdAt;
	});

export const getAllPubContributors = (pubData, onlyBylineContributors = false) => {
	const primaryCollectionPub =
		pubData.collectionPubs && pubData.collectionPubs.find((cp) => cp.isPrimary);
	const primaryCollection = primaryCollectionPub && primaryCollectionPub.collection;
	const contributors = orderedContributors(pubData.attributions)
		.concat(orderedContributors((primaryCollection && primaryCollection.attributions) || []))
		.map(ensureUserForAttribution);
	if (onlyBylineContributors) {
		return contributors.filter((attribution) => attribution.isAuthor);
	}
	return contributors;
};
