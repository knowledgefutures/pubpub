import type { DefinitelyHas, Discussion, SanitizedPubData } from 'types';

import ensureUserForAttribution from 'utils/ensureUserForAttribution';

import sanitizeDiscussions from './discussionsSanitize';
import sanitizeReviews from './reviewsSanitize';
import { sanitizePubEdges } from './sanitizePubEdge';

const sanitizeHashes = (pubData, activePermissions) => {
	const { editHash, viewHash, commentHash, reviewHash } = pubData;
	const { canView, canViewDraft, canEdit, canEditDraft } = activePermissions;
	return {
		viewHash: canView || canViewDraft ? viewHash : null,
		editHash: canEdit || canEditDraft ? editHash : null,
		commentHash: canView ? commentHash : null,
		reviewHash: canView ? reviewHash : null,
	};
};

const filterDiscussionsByDraftOrRelease = (discussions: Discussion[], isRelease: boolean) => {
	const shownVisibilityAccess = isRelease ? 'public' : 'members';
	return discussions.filter(
		(discussion): discussion is DefinitelyHas<Discussion, 'visibility'> =>
			discussion.visibility?.access === shownVisibilityAccess,
	);
};

/**
 * The Crossref deposit record is internal operational data — the full registrar
 * payload, and (once deposit state lands) registrar error text. It is eager-loaded
 * unconditionally by pubOptions for every pub query, which means it was being
 * serialized into __INITIAL_DATA__ on every PUBLIC pub page.
 *
 * Only the manage-level DOI UI needs it: AssignDoi and DataciteDeposit read
 * depositJson via utils/crossref/parseDeposit. Everything else that cares about
 * deposit existence uses the `crossrefDepositRecordId` scalar on the pub itself,
 * which is unaffected.
 */
const sanitizeCrossrefDepositRecord = (pubData, activePermissions) =>
	activePermissions.canManage ? pubData.crossrefDepositRecord : null;

/**
 * The one bit of deposit state that is not operational data: whether the DOI has
 * actually been registered. Every public surface that prints the DOI needs it
 * (the Scholar meta tags, the citation strings, the pub header), and those render
 * for readers who will never have canManage, so it cannot come from the record
 * the gate above nulls out. A status string on its own leaks nothing: the DOI it
 * describes is already on the page.
 */
const sanitizeCrossrefDepositStatus = (pubData) => pubData.crossrefDepositRecord?.status ?? null;

/**
 * Whether this DOI has ever registered, as a boolean rather than the timestamp,
 * because that is all any display rule needs. Required alongside the status for
 * the same reason the status is: `status` is per attempt, so a rejected update to
 * a live DOI reads 'failed', and a reader-facing surface keying off status alone
 * would hide a DOI that doi.org still resolves.
 */
const sanitizeCrossrefDepositEverRegistered = (pubData) =>
	Boolean(pubData.crossrefDepositRecord?.firstRegisteredAt);

const getFilteredExports = (pubData, isRelease) => {
	const { exports, releases } = pubData;
	if (!isRelease || !exports) {
		return exports;
	}
	const releaseHistoryKeys = new Set(releases.map((release) => release.historyKey));
	return exports.filter((exp) => releaseHistoryKeys.has(exp.historyKey));
};

export default (
	pubData,
	initialData,
	releaseNumber: number | null = null,
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
		crossrefDepositRecord: sanitizeCrossrefDepositRecord(pubData, activePermissions),
		crossrefDepositStatus: sanitizeCrossrefDepositStatus(pubData),
		crossrefDepositEverRegistered: sanitizeCrossrefDepositEverRegistered(pubData),
		draft: isRelease ? null : pubData.draft,
		submission: isRelease ? null : pubData.submission,
		discussions,
		edges,
		reviews,
		exports: getFilteredExports(pubData, isRelease),
		collectionPubs: filteredCollectionPubs,
		isRelease,
		releases: sortedReleases,
		releaseNumber,
	};
};
