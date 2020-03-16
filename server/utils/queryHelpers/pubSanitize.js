import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';
import { splitThreads } from 'utils';
import sanitizeThreads from './threadsSanitize';

export default (pub, initialData, historyKey, isRelease) => {
	const { loginData, scopeData } = initialData;
	const {
		canView,
		canViewDraft,
		canEdit,
		canEditDraft,
		canAdminCommunity,
	} = scopeData.activePermissions;

	/* If there are no releases and the user does not have view access, they don't have access to the pub. */
	/* Returning null will cause a 404 error to be returned. */
	if (!pub.releases.length && !canView && !canViewDraft) {
		return null;
	}

	// TODO(ian): completely unsure why we can't just the `order` parameter within the `include`
	// object for the query made above, but it doesn't seem to work.
	const sortedReleases = pub.releases
		.concat()
		.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1));
	const currentReleaseIndex =
		isRelease && pub.releases.findIndex((release) => release.branchKey === historyKey);

	const filteredThreads = sanitizeThreads(pub.threads, scopeData.activePermissions, loginData.id);
	const { discussions, forks, reviews } = splitThreads(filteredThreads);
	const filteredCollectionPubs = pub.collectionPubs
		? pub.collectionPubs.filter((item) => {
				return item.collection.isPublic || canAdminCommunity;
		  })
		: [];
	const isHistoricalDoc = historyKey && historyKey < pub.releases.length;

	return {
		...pub,
		attributions: pub.attributions.map(ensureUserForAttribution),
		discussions: discussions,
		forks: forks,
		reviews: reviews,
		collectionPubs: filteredCollectionPubs,
		isHistoricalDoc: isHistoricalDoc,
		isReadOnly: isHistoricalDoc || isRelease || !(canEdit || canEditDraft),
		isRelease: isRelease,
		releases: sortedReleases,
		currentReleaseIndex: currentReleaseIndex,
	};
};
