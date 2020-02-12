import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';
import { splitThreads } from 'utils';
import sanitizeThreads from './threadsSanitize';

export default (pub, initialData, versionNumber) => {
	const { loginData, scopeData } = initialData;
	const { canView, canViewDraft, canAdminCommunity } = scopeData.activePermissions;

	/* If there are no releases and the user does not have view access, they don't have access to the pub. */
	/* Returning null will cause a 404 error to be returned. */
	if (!pub.releases.length && !canView && !canViewDraft) {
		return null;
	}

	const filteredThreads = sanitizeThreads(pub.threads, canView, loginData.id);
	const { discussions, forks, reviews } = splitThreads(filteredThreads);
	const filteredCollectionPubs = pub.collectionPubs
		? pub.collectionPubs.filter((item) => {
				return item.collection.isPublic || canAdminCommunity;
		  })
		: [];
	return {
		...pub,
		attributions: pub.attributions.map(ensureUserForAttribution),
		discussions: discussions,
		forks: forks,
		reviews: reviews,
		collectionPubs: filteredCollectionPubs,
		isStaticDoc: !!versionNumber,
	};
};
