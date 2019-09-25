import ensureUserForAttribution from 'shared/utils/ensureUserForAttribution';
import { getBranchAccess } from '../branch/permissions';
import { checkIfSuperAdmin } from '.';

export class PubBranchNotVisibleError extends Error {
	constructor(availableBranches) {
		super();
		this.availableBranches = availableBranches;
	}
}

const canUserSeeBranch = ({ canView, canEdit, canManage, firstKeyAt }) => {
	return canManage || canEdit || (canView && firstKeyAt);
};

const canUserManagePub = (pub, communityAdminData, user = {}) => {
	const isSuperAdmin = checkIfSuperAdmin(user.id);
	/* Compute canManage */
	const isCommunityAdminManager = communityAdminData && pub.isCommunityAdminManaged;
	return pub.managers.reduce((prev, curr) => {
		if (curr.userId === user.id) {
			return true;
		}
		return prev;
	}, isCommunityAdminManager || isSuperAdmin);
};

const formatBranches = ({
	pub,
	loginData,
	communityAdminData,
	accessHash,
	canManagePub,
	branchShortId,
}) => {
	const orderedBranches = pub.branches.sort((a, b) => a.order - b.order);
	const branchesWithAccessData = orderedBranches.map((branch) => {
		const branchAccess = getBranchAccess(
			accessHash,
			branch,
			loginData.id,
			communityAdminData,
			canManagePub,
		);
		return {
			...branch,
			...branchAccess,
			editHash: branchAccess.canManage && branch.editHash,
			discussHash: branchAccess.canManage && branch.discussHash,
			viewHash: branchAccess.canManage && branch.viewHash,
		};
	});
	const visibleBranches = branchesWithAccessData.filter((br) => {
		return br.title === 'public' || canUserSeeBranch(br);
	});
	const activeBranch = branchShortId
		? // If we have a short ID, then grab the pub that matches it
		  visibleBranches.find((br) => br.shortId.toString() === branchShortId.toString())
		: // Otherwise, if we are able to see the first ordered branch...
		visibleBranches.includes(branchesWithAccessData[0])
		? // Then return it
		  branchesWithAccessData[0]
		: // Otherwise, return an empty object. This will cause the caller to throw an error, triggering a
		  // redirect to one of the other visibleBranches
		  {};
	return { activeBranch: activeBranch, branches: visibleBranches };
};

const filterReviews = ({ reviews = [] }, branches) =>
	reviews.filter((review) => {
		const sourceBranch =
			branches.find((branch) => {
				return branch.id === review.sourceBranchId;
			}) || {};
		const destinationBranch =
			branches.find((branch) => {
				return branch.id === review.destinationBranchId;
			}) || {};
		return sourceBranch.canManage || destinationBranch.canManage;
	});

const filterDiscussions = ({ discussions = [] }, branches) =>
	discussions.filter((discussion) => {
		/* 
    Note: We currently return discussions on any
    branch the reader has access to. We only do this
    to enable discussionEmbeds in the short term. 
    Once we have a better solution to discussion embeds
    in a branch world, we should use the simpler commented
    line checking ===activeBranch.id below.
    */
		const discussionBranch = branches.find((branch) => {
			return branch.id === discussion.branchId;
		});
		return discussionBranch && discussionBranch.canView;
	});

export const filterCollectionPubs = ({ collectionPubs = [] }, isCommunityAdmin) =>
	collectionPubs.filter((item) => {
		return item.collection.isPublic || isCommunityAdmin;
	});

export const formatAndAuthenticatePub = (
	{ pub, loginData, communityAdminData, accessHash, branchShortId, versionNumber },
	matchActiveBranch = true,
) => {
	const canManagePub = canUserManagePub(pub, communityAdminData, loginData);

	const { activeBranch, branches } = formatBranches({
		pub: pub,
		loginData: loginData,
		communityAdminData: communityAdminData,
		accessHash: accessHash,
		canManagePub: canManagePub,
		branchShortId: branchShortId,
	});

	/* If the activeBranch is note visible, throw an error that will trigger */
	/* a redirect. */
	if (!activeBranch || (!activeBranch.id && matchActiveBranch)) {
		throw new PubBranchNotVisibleError(branches);
	}

	/* If a user has access to no branches, they don't have access to the pub. */
	/* Returning null will cause a 404 error to be returned. */
	if (!branches.length) {
		return null;
	}

	return {
		...pub,
		branches: branches,
		activeBranch: activeBranch,
		attributions: pub.attributions.map(ensureUserForAttribution),
		reviews: filterReviews(pub, branches),
		discussions: filterDiscussions(pub, branches),
		collectionPubs: filterCollectionPubs(pub, !!communityAdminData),
		canManage: canManagePub,
		canManageBranch: activeBranch.canManage,
		canEditBranch: activeBranch.canEdit,
		canDiscussBranch: activeBranch.canDiscuss,
		canViewBranch: activeBranch.canView,
		isStaticDoc: !!versionNumber, // versionNumber is a string so we don't neet a zero check
	};
};
