import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { joinOxford } from 'utils/strings';

const orderedContributors = (maybeContributors) =>
	(maybeContributors || []).concat().sort((a, b) => {
		if (a.order !== b.order) {
			return a.order - b.order;
		}
		if (a.createdAt && b.createdAt && b.createdAt !== a.createdAt) {
			return b.createdAt.toString() > a.createdAt.toString() ? 1 : -1;
		}
		return 0;
	});

export const getAllPubContributors = (pubData, hideAuthors = false, hideContributors = false) => {
	const { collectionPubs } = pubData;
	const primaryCollectionPub = collectionPubs && collectionPubs.find((cp) => cp.isPrimary);
	const primaryCollection = primaryCollectionPub && primaryCollectionPub.collection;

	const contributors = [
		...orderedContributors(pubData.attributions),
		...orderedContributors(primaryCollection && primaryCollection.attributions),
	].map(ensureUserForAttribution);

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

export const getContributorName = (attribution) => {
	if (attribution.user) {
		return attribution.user.fullName;
	}
	return attribution.name;
};

export const getAuthorString = (pub) => {
	const contributors = getAllPubContributors(pub, false, true);
	return joinOxford(contributors.map((c) => c.user.fullName));
};
