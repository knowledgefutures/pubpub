import { Op } from 'sequelize';
import {
	Branch,
	Collection,
	CollectionPub,
	Community,
	Member,
	Pub,
	PublicPermissions,
	Release,
} from 'server/models';

import buildPubOptions from './pubOptions';
import sanitizeDiscussions from './discussionsSanitize';
import sanitizeForks from './forksSanitize';
import sanitizeReviews from './reviewsSanitize';
import { ensureSerialized, stripFalsyIdsFromQuery } from './util';
import { getCollection } from './collectionGet';

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

const getActiveIds = ({ activePub, activeCollection, activeCommunity }) => {
	return {
		pubId: activePub && activePub.id,
		collectionId: activeCollection && activeCollection.id,
		communityId: activeCommunity.id,
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

	if (!activeCommunity && communityId) {
		activeCommunity = await Community.findOne({
			where: { id: communityId },
		});
	}

	if (activeTargetType === 'pub') {
		activePub = await Pub.findOne({
			where: stripFalsyIdsFromQuery({
				communityId: activeCommunity && activeCommunity.id,
				slug: pubSlug,
				id: pubId,
			}),
			include: [
				{
					model: CollectionPub,
					as: 'collectionPubs',
					attributes: ['id', 'pubId', 'collectionId'],
				},
				{
					model: Branch,
					as: 'branches',
					attributes: ['id', 'title'],
				},
				{
					model: Release,
					as: 'releases',
					attributes: ['id'],
				},
			],
		});
		activeTarget = activePub;
		if (!activePub) {
			throw new Error('Pub Not Found');
		}
		const collections = await Collection.findAll({
			where: {
				id: { [Op.in]: (activePub.collectionPubs || []).map((cp) => cp.collectionId) },
			},
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
		activeCollection = await getCollection({
			collectionSlug: collectionSlug,
			collectionId: collectionId,
			communityId: activeCommunity && activeCommunity.id,
		});
		activeTarget = activeCollection;
	}

	if (!activeCommunity && activeTarget) {
		activeCommunity = await Community.findOne({
			where: { id: activeTarget.communityId },
		});
	}

	if (activeTargetType === 'community') {
		activeTarget = activeCommunity;
	}

	return ensureSerialized({
		activeTargetType: activeTargetType,
		activeTargetName: activeTargetType.charAt(0).toUpperCase() + activeTargetType.slice(1),
		activeTarget: activeTarget,
		activePub: activePub,
		activeCollection: activeCollection,
		activeIds: getActiveIds({
			activePub: activePub,
			activeCollection: activeCollection,
			activeCommunity: activeCommunity,
		}),
		inactiveCollections: inactiveCollections,
		activeCommunity: activeCommunity,
	});
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
	if (!loginId) {
		return [];
	}
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
	const { activePub, activeCollection, activeCommunity, inactiveCollections } = scopeElements;
	const isSuperAdmin = checkIfSuperAdmin(scopeInputs.loginId);
	const permissionLevels = ['view', 'edit', 'manage', 'admin'];
	let defaultPermissionIndex = -1;

	[activePub, activeCollection, activeCommunity, ...inactiveCollections]
		.filter((elem) => !!elem)
		.forEach((elem) => {
			if (elem.viewHash && elem.viewHash === scopeInputs.accessHash) {
				defaultPermissionIndex = 0;
			}
			if (elem.editHash && elem.editHash === scopeInputs.accessHash) {
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

	const canAdminCommunity =
		isSuperAdmin ||
		scopeMemberData.find((member) => member.communityId && member.permissions === 'admin');

	const canManageCommunity =
		isSuperAdmin ||
		canAdminCommunity ||
		scopeMemberData.find((member) => member.communityId && member.permissions === 'manage');

	const booleanOr = (precedent, value) => {
		/* Don't inherit value from null */
		return typeof value === 'boolean' ? value : precedent;
	};

	/* TODO: canCreateDiscussions should eventually pull values from PublicPermissions, */
	/* but until those are implemented, we have a simple hard-coded value */
	const communitiesWithoutPublicComments = ['25c2cfeb-dc5b-4dd7-9c82-19146688a931'];
	const canCreateDiscussions = !communitiesWithoutPublicComments.includes(activeCommunity.id);

	const initialOptions = {
		isSuperAdmin: isSuperAdmin,
		canCreateForks: null,
		canCreateReviews: null,
		canCreateDiscussions: canCreateDiscussions,
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

	const canEdit = permissionLevelIndex > 0;

	return {
		activePermission: permissionLevelIndex > -1 ? permissionLevels[permissionLevelIndex] : null,
		canView: permissionLevelIndex > -1,
		canEdit: canEdit,
		canManage: permissionLevelIndex > 1,
		canAdmin: permissionLevelIndex > 2,
		canAdminCommunity: canAdminCommunity,
		canManageCommunity: canManageCommunity,
		...activePublicPermissions,
		canCreateReviews: canEdit || activePublicPermissions.canCreateReviews,
	};
};

getActiveCounts = async (scopeInputs, scopeElements, activePermissions) => {
	/* Get counts for threads, reviews, and forks */
	const { loginId, isDashboard } = scopeInputs;
	if (!isDashboard) {
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
		pubs = collectionData.collectionPubs.map((cp) => cp.pub);
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
		const openDiscussions = pub.discussions.filter((item) => !item.isClosed);
		const discussions = sanitizeDiscussions(openDiscussions, activePermissions, loginId);

		const openForks = pub.forks.filter((item) => !item.isClosed);
		const forks = sanitizeForks(openForks, activePermissions, loginId);

		const openReviews = pub.reviews.filter((item) => item.status !== 'closed');
		const reviews = sanitizeReviews(openReviews, activePermissions, loginId);

		discussionCount += discussions.length;
		forkCount += forks.length;
		reviewCount += reviews.length;
	});

	return {
		discussionCount: discussionCount,
		forkCount: forkCount,
		reviewCount: reviewCount,
	};
};
