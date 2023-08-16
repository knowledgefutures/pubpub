import { Op } from 'sequelize';

import { ScopeId, MemberPermission, ScopeData } from 'types';
import {
	Collection,
	CollectionPub,
	Community,
	Member,
	Pub,
	PublicPermissions,
	Release,
	ReviewNew,
	Submission,
	SubmissionWorkflow,
} from 'server/models';

import { isUserSuperAdmin } from 'server/user/queries';
import { FacetsError } from 'facets';
import { fetchFacetsForScope } from 'server/facets';
import { expect } from 'utils/assert';
import { ensureSerialized, stripFalsyIdsFromQuery } from './util';
import { getCollection } from './collectionGet';

// let getScopeElements;
// let getPublicPermissionsData;
// let getScopeMemberData;
// let getActivePermissions;

const getScopeIdsObject = ({
	pubId,
	collectionId,
	communityId,
}: {
	pubId?: string;
	collectionId?: string;
	communityId: string;
}): ScopeId => {
	if (pubId) {
		return { pubId, communityId };
	}
	if (collectionId) {
		return { collectionId, communityId };
	}
	return { communityId };
};

const getActiveSubmissionsCount = ({ activeCollection }: { activeCollection: Collection }) => {
	if (activeCollection) {
		return Submission.count({
			where: {
				status: 'received',
			},
			include: [
				{
					model: SubmissionWorkflow,
					as: 'submissionWorkflow',
					required: true,
					where: { collectionId: activeCollection.id },
				},
			],
		});
	}
	return 0;
};

const getActiveReviewsCount = ({
	activeCommunity,
	activeCollection,
	activePub,
}: {
	activeCommunity: Community;
	activeCollection?: Collection;
	activePub?: Pub;
}) => {
	if (activePub) {
		return ReviewNew.count({ where: { status: 'open', pubId: activePub.id } });
	}
	if (activeCollection) {
		return ReviewNew.count({
			where: { status: 'open' },
			include: [
				{
					model: Pub,
					as: 'pub',
					required: true,
					where: { communityId: activeCommunity.id },
					include: [
						{
							model: CollectionPub,
							as: 'collectionPubs',
							required: true,
							where: { collectionId: activeCollection.id },
						},
					],
				},
			],
		});
	}
	return ReviewNew.count({
		where: { status: 'open' },
		include: [
			{ model: Pub, as: 'pub', required: true, where: { communityId: activeCommunity.id } },
		],
	});
};

const getActiveCounts = async (isDashboard: boolean, scopeElements) => {
	if (isDashboard) {
		const [reviews, submissions] = await Promise.all([
			getActiveReviewsCount(scopeElements),
			getActiveSubmissionsCount(scopeElements),
		]);
		return { reviews, submissions };
	}
	return { reviews: 0, submissions: 0 };
};

const getFacets = async (includeFacets: boolean, scopeElements: ScopeData['elements']) => {
	if (includeFacets && scopeElements.activeTarget) {
		const { activeTarget, activeTargetType } = scopeElements;
		if (activeTargetType === 'organization') {
			throw new FacetsError('No such thing as an organization');
		}
		const facets = await fetchFacetsForScope({ kind: activeTargetType, id: activeTarget.id });
		return { facets };
	}
	return null;
};

const getActiveIds = ({
	activePub,
	activeCollection,
	activeCommunity,
}: {
	activePub: Pub | null;
	activeCollection: Collection | null;
	activeCommunity?: Community | null;
}) => {
	return {
		pubId: activePub && activePub.id,
		collectionId: activeCollection && activeCollection.id,
		communityId: activeCommunity?.id,
	};
};

const getScopeElements = async (
	scopeInputs: {
		communityId?: string | null;
		collectionId?: string | null;
		collectionSlug?: string | null;
		pubId?: string | null;
		pubSlug?: string | null;
	} = {
		communityId: null,
		collectionId: null,
		collectionSlug: null,
		pubId: null,
		pubSlug: null,
	},
) => {
	const { communityId, collectionId, collectionSlug, pubId, pubSlug } = scopeInputs;
	let activeTarget: Pub | Collection | Community | null = null;
	let activePub: Pub | null = null;
	let activeCollection: Collection | null = null;
	let inactiveCollections: Collection[] = [];
	let activeCommunity: Community | null = null;
	let activeTargetType: 'community' | 'pub' | 'collection' = 'community';
	if (pubSlug || pubId) {
		activeTargetType = 'pub';
	} else if (collectionSlug || collectionId) {
		activeTargetType = 'collection';
	}

	if (!activeCommunity && communityId) {
		activeCommunity = expect(
			await Community.findOne({
				where: { id: communityId },
			}),
		);
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
					attributes: ['id', 'pubId', 'collectionId', 'pubRank'],
					include: [
						{
							model: Collection,
							as: 'collection',
							attributes: ['kind', 'isPublic'],
						},
					],
				},
				{
					model: Release,
					as: 'releases',
					attributes: ['id', 'historyKey'],
				},
				{
					model: Submission,
					as: 'submission',
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
			collectionSlug,
			collectionId,
			communityId: activeCommunity?.id,
		});
		// if (!activeCollection) {
		// 	throw new Error('Pub Not Found');
		// }
		activeTarget = activeCollection;
	}

	if (!activeCommunity && activeTarget) {
		activeCommunity = await Community.findOne({
			where: { id: expect(activeTarget.communityId) },
		});
	}

	if (activeTargetType === 'community') {
		activeTarget = activeCommunity;
	}

	return ensureSerialized({
		activeTargetType,
		activeTargetName: activeTargetType.charAt(0).toUpperCase() + activeTargetType.slice(1),
		activeTarget: activeTarget as Community | Collection | Pub,
		activePub,
		activeCollection,
		activeIds: getActiveIds({
			activePub,
			activeCollection,
			activeCommunity,
		}),
		inactiveCollections,
		activeCommunity,
	});
};

export const buildOrQuery = (scopeElements) => {
	const { activePub, activeCollection, inactiveCollections, activeCommunity } = scopeElements;
	const orQuery = [];
	// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
	orQuery.push({ communityId: activeCommunity.id });
	if (activePub) {
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
		orQuery.push({ pubId: activePub.id });
	}
	if (activeCollection || inactiveCollections.length) {
		const collectionsList = [...inactiveCollections];
		if (activeCollection) {
			collectionsList.push(activeCollection);
		}
		// @ts-expect-error ts-migrate(2418) FIXME: Type of computed property's value is 'any[]', whic... Remove this comment to see the full error message
		orQuery.push({
			collectionId: {
				[Op.in]: collectionsList.map((cl) => cl.id),
			},
		});
	}
	return orQuery;
};

const getPublicPermissionsData = async (scopeElements) => {
	const orQuery = buildOrQuery(scopeElements);
	return PublicPermissions.findAll({
		where: {
			[Op.or]: orQuery,
		},
	});
};

const getScopeMemberData = async (scopeInputs, scopeElements) => {
	const { loginId } = scopeInputs;
	if (!loginId) {
		return [];
	}
	const orQuery = buildOrQuery(scopeElements);
	const members = await Member.findAll({
		where: {
			userId: loginId,
			[Op.or]: orQuery,
		},
	});
	return members.map((member) => member.toJSON());
};

const getActivePermissions = async (
	scopeInputs,
	scopeElements,
	publicPermissionsData,
	scopeMemberData,
) => {
	const { activePub, activeCollection, activeCommunity, inactiveCollections } = scopeElements;
	const isSuperAdmin = await isUserSuperAdmin({ userId: scopeInputs.loginId });
	const permissionLevels: MemberPermission[] = ['view', 'edit', 'manage', 'admin'];
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
			if (elem.reviewHash && elem.reviewHash === scopeInputs.accessHash) {
				defaultPermissionIndex = 0;
			}
			if (elem.commentHash && elem.commentHash === scopeInputs.accessHash) {
				defaultPermissionIndex = 0;
			}
		});

	if (isSuperAdmin) {
		defaultPermissionIndex = 3;
	}

	const permissionLevelIndex = scopeMemberData.reduce((prev, curr) => {
		const currLevelIndex = permissionLevels.indexOf(curr.permissions);
		return currLevelIndex > prev ? currLevelIndex : prev;
	}, defaultPermissionIndex);

	const memberHasCommunityPermissions = (permissionLevel: MemberPermission) => {
		return (
			permissionLevels.includes(permissionLevel) &&
			scopeMemberData.find(
				(member) => member.communityId && member.permissions === permissionLevel,
			)
		);
	};

	const canAdminCommunity = isSuperAdmin || memberHasCommunityPermissions('admin');
	const canManageCommunity = canAdminCommunity || memberHasCommunityPermissions('manage');
	const canEditCommunity = canManageCommunity || memberHasCommunityPermissions('edit');
	const canViewCommunity = canEditCommunity || memberHasCommunityPermissions('view');

	const booleanOr = (precedent, value) => {
		/* Don't inherit value from null */
		return typeof value === 'boolean' ? value : precedent;
	};

	const initialOptions = {
		isSuperAdmin,
		canCreateReviews: null,
		canCreateDiscussions: true,
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
	const canCreateReviews = canEdit || activePublicPermissions.canCreateReviews;

	return {
		activePermission: permissionLevelIndex > -1 ? permissionLevels[permissionLevelIndex] : null,
		canView: permissionLevelIndex > -1,
		canEdit,
		canManage: permissionLevelIndex > 1,
		canAdmin: permissionLevelIndex > 2,
		canAdminCommunity,
		canManageCommunity,
		canViewCommunity,
		canEditCommunity,
		...activePublicPermissions,
		canCreateReviews,
	};
};

/* getScopeData can be called from either a route (e.g. to authenticate */
/* whether a user has access to /pub/example), or it can be called from */
/* an API route to verify a user's permissions. When called from a route */
/* it is likely that collectionSlug and pubSlug will be used. */
/* When called from an API endpoint, it is likely that collectionId and pubId will be used. */
export default async (scopeInputs: {
	communityId?: string | null;
	pubId?: string | null;
	pubSlug?: string | null;
	collectionId?: string | null;
	collectionSlug?: string | null;
	accessHash?: string | null;
	loginId?: string | null;
	isDashboard?: boolean | null;
	includeFacets?: boolean | null;
}) => {
	/* scopeInputs = 
		{
			collectionId, collectionSlug,
			pubId, pubSlug,
			accessHash,
			loginId,
			isDashboard,
		}
	*/

	const scopeElements = await getScopeElements(scopeInputs);
	const facets = await getFacets(!!scopeInputs.includeFacets, scopeElements);

	const publicPermissionsData = await getPublicPermissionsData(scopeElements);
	const scopeMemberData = await getScopeMemberData(scopeInputs, scopeElements);
	const [activePermissions, activeCounts] = await Promise.all([
		getActivePermissions(scopeInputs, scopeElements, publicPermissionsData, scopeMemberData),
		getActiveCounts(!!scopeInputs.isDashboard, scopeElements),
	]);

	return {
		elements: scopeElements,
		optionsData: publicPermissionsData,
		memberData: scopeMemberData,
		activePermissions,
		activeCounts,
		scope: getScopeIdsObject(scopeElements.activeIds),
		...facets,
	};
};
