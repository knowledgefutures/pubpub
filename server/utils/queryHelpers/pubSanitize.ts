import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { Discussion, SanitizedPubData } from 'types';

import sanitizeDiscussions from './discussionsSanitize';
import sanitizeReviews from './reviewsSanitize';
import { sanitizePubEdges } from './sanitizePubEdge';

const sanitizeHashes = (pubData, activePermissions) => {
	const { editHash, viewHash } = pubData;
	const { canView, canViewDraft, canEdit, canEditDraft } = activePermissions;
	return {
		viewHash: canView || canViewDraft ? viewHash : null,
		editHash: canEdit || canEditDraft ? editHash : null,
	};
};

const filterDiscussionsByDraftOrRelease = (discussions: Discussion[], isRelease: boolean) => {
	const shownVisibilityAccess = isRelease ? 'public' : 'members';
	return discussions.filter(
		(discussion) => discussion.visibility.access === shownVisibilityAccess,
	);
};

const getFilteredExports = (pubData, isRelease) => {
	const { exports, releases } = pubData;
	if (!isRelease) {
		return exports;
	}
	const releaseHistoryKeys = new Set(releases.map((release) => release.historyKey));
	return exports.filter((exp) => releaseHistoryKeys.has(exp.historyKey));
};

export default (
	pubData,
	initialData,
	releaseNumber: number | null = null,
	isReview: boolean = false,
): null | SanitizedPubData => {
	const { loginData, scopeData } = initialData;
	const { activePermissions } = scopeData;
	const { canView, canViewDraft } = activePermissions;

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

	const isRelease = typeof releaseNumber === 'number' && releaseNumber > 0;
	if (isRelease) {
		if (typeof releaseNumber === 'number' && releaseNumber > pubData.releases.length) {
			return null;
		}
	}

	// TODO(ian): completely unsure why we can't just the `order` parameter within the `include`
	// object for the query made above, but it doesn't seem to work.
	const sortedReleases = pubData.releases
		.concat()
		.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1));

	const discussions =
		pubData.discussions &&
		sanitizeDiscussions(
			filterDiscussionsByDraftOrRelease(pubData.discussions, isRelease),
			activePermissions,
			loginData.id,
		);
	const reviews =
		pubData.reviews && sanitizeReviews(pubData.reviews, activePermissions, loginData.id);

	const edges = pubData.edges && sanitizePubEdges(initialData, pubData.edges);

	return {
		...pubData,
		...sanitizeHashes(pubData, activePermissions),
		attributions: pubData.attributions.map(ensureUserForAttribution),
		draft: isRelease ? null : pubData.draft,
		submission: isRelease ? null : pubData.submission,
		discussions,
		edges,
		reviews,
		exports: getFilteredExports(pubData, isRelease),
		collectionPubs: filteredCollectionPubs,
		isRelease,
		isReview,
		releases: sortedReleases,
		releaseNumber,
	};
};
