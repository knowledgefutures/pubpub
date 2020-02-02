import { Op } from 'sequelize';
import { Collection, Community, Pub, CollectionPub, Member, ScopeOptions, Branch } from '../models';

let getScopeElements;
let getScopeOptionsData;
let getScopeMemberData;
let getActivePermissions;

/* getScopeData can be called from either a route (e.g. to authenticate */
/* whether a user has access to /pub/example), or it can be called from */
/* an API route to verify a user's permissions. When called from a route */
/* it is likely that communityData, collectionSlug, and pubSlug will be used. */
/* When called from an API endpoint, it is likely that communityId, */
/* collectionId, and pubId will be used. */
export const getScopeData = async (scopeInputs) => {
	/* scopeInputs = 
		{
			communityId, communityData,
			collectionId, collectionSlug,
			pubId, pubSlug,
			accessHash,
			loginId,

		}
	*/
	const scopeElements = await getScopeElements(scopeInputs);
	const scopeOptionsData = await getScopeOptionsData(scopeElements);
	const scopeMemberData = await getScopeMemberData(scopeInputs, scopeElements);
	const activePermissions = await getActivePermissions(
		scopeInputs,
		scopeElements,
		scopeOptionsData,
		scopeMemberData,
	);
	return {
		elements: scopeElements,
		optionsData: scopeOptionsData,
		memberData: scopeMemberData,
		activePermissions: activePermissions,
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

getScopeOptionsData = async (scopeElements) => {
	const orQuery = buildOrQuery(scopeElements);
	return ScopeOptions.findAll({
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

getActivePermissions = async (scopeInputs, scopeElements, scopeOptionsData, scopeMemberData) => {
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
		isPublicBranches: null,
		isPublicDiscussions: null,
		isPublicReviews: null,
	};
	const activeOptions = scopeOptionsData
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

	return {
		activePermission: permissionLevelIndex > -1 ? permissionLevels[permissionLevelIndex] : null,
		canView: permissionLevelIndex > -1,
		canEdit: permissionLevelIndex > 0,
		canManage: permissionLevelIndex > 1,
		canAdmin: permissionLevelIndex > 2,
		canAdminCommunity: canAdminCommunity,
		...activeOptions,
	};
};
