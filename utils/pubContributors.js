import ensureUserForAttribution from 'utils/ensureUserForAttribution';

const orderedContributors = (contributors) =>
	contributors.concat().sort((a, b) => {
		if (a.order !== b.order) {
			return a.order - b.order;
		}
		return b.createdAt - a.createdAt;
	});

export const getAllPubContributors = (pubData, hideAuthors = false, hideContributors = false) => {
	const primaryCollectionPub =
		pubData.collectionPubs && pubData.collectionPubs.find((cp) => cp.isPrimary);
	const primaryCollection = primaryCollectionPub && primaryCollectionPub.collection;
	const contributors = orderedContributors(pubData.attributions)
		.concat(orderedContributors((primaryCollection && primaryCollection.attributions) || []))
		.map(ensureUserForAttribution);

	const outputContributors = contributors.filter((attribution) => {
		if (hideAuthors && attribution.isAuthor) {
			return false;
		}
		if (hideContributors && !attribution.isAuthor) {
			return false;
		}
		return true;
	});

	const uniqueAuthorIds = [];
	return outputContributors.filter((attribution) => {
		if (uniqueAuthorIds.includes(attribution.user.id)) {
			return false;
		}
		uniqueAuthorIds.push(attribution.user.id);
		return true;
	});
};
