import { Op } from 'sequelize';
import { splitThreads } from 'utils';
import {
	Collection,
	Community,
	Pub,
	CollectionPub,
	Member,
	PublicPermissions,
	Branch,
} from '../../models';
import buildPubOptions from './pubOptions';
import sanitizeThreads from './threadsSanitize';

let getScopeElements;
let getPublicPermissionsData;
let getScopeMemberData;
let getActivePermissions;
let getActiveCounts;

/* getScopeData can be called from either a route (e.g. to authenticate */
/* whether a user has access to /pub/example), or it can be called from */
/* an API route to verify a user's permissions. When called from a route */
/* it is likely that communityData, collectionSlug, and pubSlug will be used. */
/* When called from an API endpoint, it is likely that communityId, */
/* collectionId, and pubId will be used. */
export default async (scopeInputs) => {
	/* scopeInputs = 
		{
			communityId, communityData,
			collectionId, collectionSlug,
			pubId, pubSlug,
			accessHash,
			loginId,
			isDashboard,
		}
	*/
	const scopeElements = await getScopeElements(scopeInputs);
	const publicPermissionsData = await getPublicPermissionsData(scopeElements);
	const scopeMemberData = await getScopeMemberData(scopeInputs, scopeElements);
	const activePermissions = await getActivePermissions(
		scopeInputs,
		scopeElements,
		publicPermissionsData,
		scopeMemberData,
	);
	const activeCounts = await getActiveCounts(scopeInputs, scopeElements, activePermissions);
	return {
		elements: scopeElements,
		optionsData: publicPermissionsData,
		memberData: scopeMemberData,
		activePermissions: activePermissions,
		activeCounts: activeCounts,
	};
};

getScopeElements = async (scopeInputs) => {
	const {
		communityId,
		communityData,
		collectionId,
		collectionSlug,
		pubId,
		pubSlug,
	} = scopeInputs;
	let activeTarget;
	let activePub;
	let activeCollection;
	let inactiveCollections = [];
	let activeCommunity = communityData;
	let activeTargetType = 'community';
	if (pubSlug || pubId) {
		activeTargetType = 'pub';
	} else if (collectionSlug || collectionId) {
		activeTargetType = 'collection';
	}

	if (!activeCommunity) {
		activeCommunity = await Community.findOne({
			where: { id: communityId },
		});
	}

	if (activeTargetType === 'pub') {
		const query = pubId
			? { id: pubId, communityId: activeCommunity.id }
			: { slug: pubSlug, communityId: activeCommunity.id };
		activePub = await Pub.findOne({
			where: query,
			include: [
				{
					model: CollectionPub,
					as: 'collectionPubs',
					required: false,
					attributes: ['id', 'pubId', 'collectionId'],
				},
				{
					model: Branch,
					as: 'branches',
					attributes: ['id', 'title'],
				},
			],
		});
		activeTarget = activePub;
		const collections = await Collection.findAll({
			where: { id: { [Op.in]: activePub.collectionPubs.map((cp) => cp.collectionId) } },
		});
		inactiveCollections = collections.filter((collection) => {
			const isActive = collection.slug === collectionSlug;
			if (isActive) {
				activeCollection = collection;
			}
			return !isActive;
		});
	}

	if (activeTargetType === 'collection') {
		const query = collectionId
			? { id: collectionId, communityId: activeCommunity.id }
			: { slug: collectionSlug, communityId: activeCommunity.id };
		activeCollection = await Collection.findOne({
			where: query,
		});
		activeTarget = activeCollection;
	}

	if (activeTargetType === 'community') {
		activeTarget = activeCommunity;
	}

	return {
		activeTargetType: activeTargetType,
		activeTarget: activeTarget,
		activePub: activePub,
		activeCollection: activeCollection,
		inactiveCollections: inactiveCollections,
		activeCommunity: activeCommunity,
	};
};

export const buildOrQuery = (scopeElements) => {
	const { activePub, activeCollection, inactiveCollections, activeCommunity } = scopeElements;
	const orQuery = [];
	orQuery.push({ communityId: activeCommunity.id });
	if (activePub) {
		orQuery.push({ pubId: activePub.id });
	}
	if (activeCollection || inactiveCollections.length) {
		const collectionsList = [...inactiveCollections];
		if (activeCollection) {
			collectionsList.push(activeCollection);
		}
		orQuery.push({
			collectionId: {
				[Op.in]: collectionsList.map((cl) => cl.id),
			},
		});
	}
	return orQuery;
};

getPublicPermissionsData = async (scopeElements) => {
	const orQuery = buildOrQuery(scopeElements);
	return PublicPermissions.findAll({
		where: {
			[Op.or]: orQuery,
		},
	});
};

getScopeMemberData = async (scopeInputs, scopeElements) => {
	const { loginId } = scopeInputs;
	const orQuery = buildOrQuery(scopeElements);
	return Member.findAll({
		where: {
			userId: loginId,
			[Op.or]: orQuery,
		},
	});
};

export const checkIfSuperAdmin = (userId) => {
	const adminIds = ['b242f616-7aaa-479c-8ee5-3933dcf70859'];
	return adminIds.includes(userId);
};

getActivePermissions = async (
	scopeInputs,
	scopeElements,
	publicPermissionsData,
	scopeMemberData,
) => {
	const isSuperAdmin = checkIfSuperAdmin(scopeInputs.loginId);
	const permissionLevels = ['view', 'edit', 'manage', 'admin'];
	let defaultPermissionIndex = -1;
	[
		scopeElements.activePub,
		scopeElements.activeCollection,
		scopeElements.activeCommunity,
		...scopeElements.inactiveCollections,
	]
		.filter((elem) => !!elem)
		.forEach((elem) => {
			if (elem.viewHash === scopeInputs.accessHash) {
				defaultPermissionIndex = 0;
			}
			if (elem.editHash === scopeInputs.accessHash) {
				defaultPermissionIndex = 1;
			}
		});
	if (isSuperAdmin) {
		defaultPermissionIndex = 3;
	}
	const permissionLevelIndex = scopeMemberData.reduce((prev, curr) => {
		const currLevelIndex = permissionLevels.indexOf(curr.permissions);
		return currLevelIndex > prev ? currLevelIndex : prev;
	}, defaultPermissionIndex);
	const canAdminCommunity = scopeMemberData.reduce((prev, curr) => {
		if (curr.communityId && curr.permissions === 'admin') {
			return true;
		}
		return prev;
	}, isSuperAdmin);

	const booleanOr = (precedent, value) => {
		/* Don't inherit value from null */
		return typeof value === 'boolean' ? value : precedent;
	};

	const initialOptions = {
		canCreateForks: null,
		canCreateReviews: null,
		canCreateDiscussions: null,
		canViewDraft: null,
		canEditDraft: null,
	};
	const activePublicPermissions = publicPermissionsData
		.sort((foo, bar) => {
			/* Sort the optionsData so that the options assocaited with */
			/* the community come first, collections come next, and pub comes last */
			if (foo.communityId && (bar.collectionId || bar.pubId)) {
				return -1;
			}
			if (bar.communityId && (foo.collectionId || foo.pubId)) {
				return 1;
			}
			if (foo.collectionId && bar.pubId) {
				return -1;
			}
			if (bar.collectionId && foo.pubId) {
				return 1;
			}
			return 0;
		})
		.reduce((prev, curr) => {
			const next = { ...prev };
			Object.keys(prev).forEach((key) => {
				next[key] = booleanOr(prev[key], curr[key]);
			});
			return next;
		}, initialOptions);

	/* If canEditDraft is true, canViewDraft must also be true */
	activePublicPermissions.canViewDraft =
		activePublicPermissions.canViewDraft || activePublicPermissions.canEditDraft;

	return {
		activePermission: permissionLevelIndex > -1 ? permissionLevels[permissionLevelIndex] : null,
		canView: permissionLevelIndex > -1,
		canEdit: permissionLevelIndex > 0,
		canManage: permissionLevelIndex > 1,
		canAdmin: permissionLevelIndex > 2,
		canAdminCommunity: canAdminCommunity,
		...activePublicPermissions,
	};
};

getActiveCounts = async (scopeInputs, scopeElements, activePermissions) => {
	/* Get counts for threads, reviews, and forks */
	const { loginId, isDashboard } = scopeInputs;
	if (isDashboard) {
		return {};
	}

	const { activeTarget, activeTargetType } = scopeElements;
	let discussionCount = 0;
	let reviewCount = 0;
	let forkCount = 0;
	let pubs = [];
	const pubQueryOptions = buildPubOptions({ isAuth: true });
	if (activeTargetType === 'pub') {
		const pubData = await Pub.findOne({
			where: { id: activeTarget.id },
			...pubQueryOptions,
		});
		pubs = [pubData];
	}

	if (activeTargetType === 'collection') {
		const collectionData = await Collection.findOne({
			where: { id: activeTarget.id },
			attributes: ['id'],
			include: [
				{
					model: CollectionPub,
					as: 'collectionPubs',
					include: [{ model: Pub, as: 'pub', ...pubQueryOptions }],
				},
			],
		});
		pubs = collectionData.collectionPubs;
	}
	if (activeTargetType === 'community') {
		const communityCountData = await Community.findOne({
			where: { id: activeTarget.id },
			attributes: ['id'],
			include: [{ model: Pub, as: 'pubs', ...pubQueryOptions }],
		});
		pubs = communityCountData.pubs;
	}
	pubs.forEach((pub) => {
		const openThreads = pub.threads.filter((thread) => {
			return !thread.isClosed;
		});
		const visibleThreads = sanitizeThreads(openThreads, activePermissions.canView, loginId);
		const { discussions, forks, reviews } = splitThreads(visibleThreads);
		reviewCount += discussions.length;
		forkCount += forks.length;
		discussionCount += reviews.length;
	});

	return {
		discussionCount: discussionCount,
		forkCount: forkCount,
		reviewCount: reviewCount,
	};
};
