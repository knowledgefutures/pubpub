import ensureUserForAttribution from 'utils/ensureUserForAttribution';

import sanitizeDiscussions from './discussionsSanitize';
import sanitizeForks from './forksSanitize';
import sanitizeReviews from './reviewsSanitize';

const sanitizeHashes = (pubData, activePermissions) => {
	const { editHash, viewHash } = pubData;
	const { canView, canViewDraft, canEdit, canEditDraft } = activePermissions;
	return {
		viewHash: canView || canViewDraft ? viewHash : null,
		editHash: canEdit || canEditDraft ? editHash : null,
	};
};

export default (pubData, initialData, releaseNumber) => {
	const { loginData, scopeData } = initialData;
	const { activePermissions } = scopeData;
	const { canView, canViewDraft, canEdit, canEditDraft } = activePermissions;

	const hasPubMemberAccess = pubData.members.some((member) => {
		return member.userId === initialData.loginData.id;
	});
	const visibleCollectionIds = initialData.communityData.collections.map((cl) => cl.id);
	const filteredCollectionPubs = pubData.collectionPubs
		? pubData.collectionPubs.filter((item) => {
				return visibleCollectionIds.includes(item.collectionId);
		  })
		: [];
	const hasCollectionMemberAccess = filteredCollectionPubs.reduce((prev, currCp) => {
		const currCollection = initialData.communityData.collections.find((cl) => {
			return currCp.collectionId === cl.id;
		});
		const hasCurrCollectionMemberAccess = currCollection.members.some((member) => {
			return member.userId === initialData.loginData.id;
		});
		return prev || hasCurrCollectionMemberAccess;
	}, false);
	/* If there are no releases and the user does not have view access, */
	/* we then must check if they have pub-level access or */
	/* community-level access, otherwise we return null. */
	if (
		!pubData.releases.length &&
		!canView &&
		!canViewDraft &&
		!hasPubMemberAccess &&
		!hasCollectionMemberAccess
	) {
		return null;
	}

	const isRelease = !!releaseNumber;
	if (isRelease && pubData.releases.length < releaseNumber) {
		return null;
	}

	// TODO(ian): completely unsure why we can't just the `order` parameter within the `include`
	// object for the query made above, but it doesn't seem to work.
	const sortedReleases = pubData.releases
		.concat()
		.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1));

	const discussions = sanitizeDiscussions(pubData.discussions, activePermissions, loginData.id);
	const forks = sanitizeForks(pubData.forks, activePermissions, loginData.id);
	const reviews = sanitizeReviews(pubData.reviews, activePermissions, loginData.id);

	return {
		...pubData,
		...sanitizeHashes(pubData, activePermissions),
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
