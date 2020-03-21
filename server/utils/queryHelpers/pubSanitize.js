import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';
import { splitThreads } from 'utils';
import sanitizeThreads from './threadsSanitize';

export default (pubData, initialData, releaseNumber) => {
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
	if (!pubData.releases.length && !canView && !canViewDraft) {
		return null;
	}

	const isRelease = !!(releaseNumber || releaseNumber === 0);

	// TODO(ian): completely unsure why we can't just the `order` parameter within the `include`
	// object for the query made above, but it doesn't seem to work.
	const sortedReleases = pubData.releases
		.concat()
		.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1));

	const filteredThreads = sanitizeThreads(
		pubData.threads,
		scopeData.activePermissions,
		loginData.id,
	);

	const { discussions, forks, reviews } = splitThreads(filteredThreads);
	const filteredCollectionPubs = pubData.collectionPubs
		? pubData.collectionPubs.filter((item) => {
				return item.collection.isPublic || canAdminCommunity;
		  })
		: [];

	return {
		...pubData,
		attributions: pubData.attributions.map(ensureUserForAttribution),
		discussions: discussions,
		forks: forks,
		reviews: reviews,
		collectionPubs: filteredCollectionPubs,
		isReadOnly: isRelease || !(canEdit || canEditDraft),
		isRelease: isRelease,
		releases: sortedReleases,
		releaseNumber: releaseNumber,
	};
};
