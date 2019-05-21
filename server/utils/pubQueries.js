/* eslint-disable import/prefer-default-export */
import { attributesPublicUser, checkIfSuperAdmin } from '.';
import { generateCitationHTML } from './citations';
import { getBranchDoc } from './firebaseAdmin';
import calculateBranchAccess from '../branch/calculateBranchAccess';
import {
	User,
	Pub,
	Discussion,
	CommunityAdmin,
	PubManager,
	PubAttribution,
	Tag,
	CollectionPub,
	Collection,
	CollectionAttribution,
	Page,
	Branch,
	BranchPermission,
} from '../models';

// const calculateBranchPermissions = (
// 	req,
// 	branchData,
// 	loginData,
// 	communityAdminData,
// 	canManagePub,
// 	isSuperAdmin,
// ) => {
// 	/* Compute canManageBranch */
// 	const isCommunityAdminBranchManager =
// 		communityAdminData && branchData.communityAdminPermissions === 'manage';
// 	const isPubManagerBranchManager = canManagePub && branchData.pubManagerPermissions === 'manage';
// 	const canManageBranch = branchData.permissions.reduce((prev, curr) => {
// 		if (curr.userId === loginData.id && curr.permissions === 'manage') {
// 			return true;
// 		}
// 		return prev;
// 	}, isCommunityAdminBranchManager || isPubManagerBranchManager || isSuperAdmin);

// 	/* Compute canEditBranch */
// 	const isValidEditHash = req.query.access === branchData.editHash;
// 	const isCommunityAdminEditor =
// 		communityAdminData && branchData.communityAdminPermissions === 'edit';
// 	const isPubManagerBranchEditor = canManagePub && branchData.pubManagerPermissions === 'edit';
// 	const isPublicBranchEditor = branchData.publicPermissions === 'edit';
// 	const canEditBranch = branchData.permissions.reduce((prev, curr) => {
// 		if (curr.userId === loginData.id && curr.permissions === 'edit') {
// 			return true;
// 		}
// 		return prev;
// 	}, canManageBranch || isValidEditHash || isCommunityAdminEditor || isPubManagerBranchEditor || isPublicBranchEditor);

// 	/* Compute canDiscussBranch */
// 	const isValidDiscussHash = req.query.access === branchData.discussHash;
// 	const isCommunityAdminDiscussor =
// 		communityAdminData && branchData.communityAdminPermissions === 'discuss';
// 	const isPubManagerBranchDiscussor =
// 		canManagePub && branchData.pubManagerPermissions === 'discuss';
// 	const isPublicBranchDiscussor = branchData.publicPermissions === 'discuss';
// 	const canDiscussBranch = branchData.permissions.reduce((prev, curr) => {
// 		if (curr.userId === loginData.id && curr.permissions === 'discuss') {
// 			return true;
// 		}
// 		return prev;
// 	}, canEditBranch || isValidDiscussHash || isCommunityAdminDiscussor || isPubManagerBranchDiscussor || isPublicBranchDiscussor);

// 	/* Compute canViewBranch */
// 	const isValidViewHash = req.query.access === branchData.viewHash;
// 	const isCommunityAdminViewer =
// 		communityAdminData && branchData.communityAdminPermissions === 'view';
// 	const isPubManagerBranchViewer = canManagePub && branchData.pubManagerPermissions === 'view';
// 	const isPublicBranchViewer = branchData.publicPermissions === 'view';
// 	const canViewBranch = branchData.permissions.reduce((prev, curr) => {
// 		if (curr.userId === loginData.id && curr.permissions === 'view') {
// 			return true;
// 		}
// 		return prev;
// 	}, canDiscussBranch || isValidViewHash || isCommunityAdminViewer || isPubManagerBranchViewer || isPublicBranchViewer);

// 	return {
// 		canManage: canManageBranch,
// 		canEdit: canEditBranch,
// 		canDiscuss: canDiscussBranch,
// 		canView: canViewBranch,
// 	};
// };

export const formatAndAuthenticatePub = (pub, loginData, communityAdminData, req) => {
	/* Used to format pub JSON and to test */
	/* whether the user has permissions */
	const isSuperAdmin = checkIfSuperAdmin(loginData.id);
	/* Compute canManage */
	const isCommunityAdminManager = communityAdminData && pub.isCommunityAdminManaged;
	const canManagePub = pub.managers.reduce((prev, curr) => {
		if (curr.userId === loginData.id) {
			return true;
		}
		return prev;
	}, isCommunityAdminManager || isSuperAdmin);

	const formattedBranches = pub.branches
		.sort((foo, bar) => {
			if (foo.order < bar.order) {
				return -1;
			}
			if (foo.order > bar.order) {
				return 1;
			}
			return 0;
		})
		.map((branch) => {
			const branchAccess = calculateBranchAccess(
				req.query.access,
				branch,
				loginData.id,
				communityAdminData,
				canManagePub,
			);

			return {
				...branch,
				...branchAccess,
				editHash: branchAccess.canManage ? branch.editHash : undefined,
				discussHash: branchAccess.canManage ? branch.discussHash : undefined,
				viewHash: branchAccess.canManage ? branch.viewHash : undefined,
			};
		})
		.filter((branch) => {
			return branch.canView;
		});

	if (!formattedBranches.length) {
		return null;
	}

	const activeBranch = formattedBranches.reduce((prev, curr, index) => {
		if (index === 0) {
			return curr;
		}
		if (curr.shortId === Number(req.params.branchShortId)) {
			return curr;
		}
		return prev;
	}, undefined);

	const formattedPubData = {
		...pub,
		branches: formattedBranches,
		activeBranch: activeBranch,
		attributions: pub.attributions.map((attribution) => {
			if (attribution.user) {
				return attribution;
			}
			return {
				...attribution,
				user: {
					id: attribution.id,
					initials: attribution.name[0],
					fullName: attribution.name,
					firstName: attribution.name.split(' ')[0],
					lastName: attribution.name
						.split(' ')
						.slice(1, attribution.name.split(' ').length)
						.join(' '),
					avatar: attribution.avatar,
					title: attribution.title,
				},
			};
		}),
		discussions: pub.discussions
			? pub.discussions.filter((discussion) => {
					return discussion.branchId === activeBranch.id;
			  })
			: undefined,
		/* TODO: Why are we not filtering collections as below anymore? */
		// collections: pub.collections
		// 	? pub.collections.filter((item)=> {
		// 		return item.isPublic || communityAdminData;
		// 	})
		// 	: undefined,
		collectionPubs: pub.collectionPubs
			.map((item) => {
				if (!communityAdminData && item.collection && !item.collection.isPublic) {
					return {
						...item,
						collection: undefined,
					};
				}
				return item;
			})
			.filter((item) => {
				return !item.collection || item.collection.isPublic || communityAdminData;
			}),
		canManage: canManage,
		canManageBranch: activeBranch.canManage,
		canEditBranch: activeBranch.canEdit,
		canDiscussBranch: activeBranch.canDiscuss,
		canViewBranch: activeBranch.canView,
		isStaticDoc: !!req.params.versionNumber,
	};

	return formattedPubData;
};

export const findPub = (req, initialData, mode) => {
	const getPubData = Pub.findOne({
		where: {
			slug: req.params.slug.toLowerCase(),
			communityId: initialData.communityData.id,
		},
		include: [
			{
				model: PubManager,
				as: 'managers',
				separate: true,
				include: [
					{
						model: User,
						as: 'user',
						attributes: attributesPublicUser,
					},
				],
			},
			{
				model: PubAttribution,
				as: 'attributions',
				required: false,
				separate: true,
				include: [
					{
						model: User,
						as: 'user',
						required: false,
						attributes: attributesPublicUser,
					},
				],
			},
			{
				model: CollectionPub,
				as: 'collectionPubs',
				required: false,
				separate: true,
				include: [
					{
						model: Collection,
						as: 'collection',
						include: [
							{
								model: Page,
								as: 'page',
								required: false,
								attributes: ['id', 'title', 'slug'],
							},
						],
					},
				],
			},
			{
				required: false,
				separate: true,
				model: Discussion,
				as: 'discussions',
				include: [
					{
						model: User,
						as: 'author',
						attributes: attributesPublicUser,
					},
				],
			},
			{
				// separate: true,
				model: Branch,
				as: 'branches',
				required: true,
				include: [
					{
						model: BranchPermission,
						as: 'permissions',
						separate: true,
						required: false,
						include: [
							{
								model: User,
								as: 'user',
								attributes: attributesPublicUser,
							},
						],
					},
				],
			},
		],
	});

	const getCommunityAdminData = CommunityAdmin.findOne({
		where: {
			userId: initialData.loginData.id,
			communityId: initialData.communityData.id,
		},
	});
	return Promise.all([getPubData, getCommunityAdminData])
		.then(([pubData, communityAdminData]) => {
			if (!pubData) {
				throw new Error('Pub Not Found');
			}
			const pubDataJson = pubData.toJSON();
			const formattedPubData = formatAndAuthenticatePub(
				pubDataJson,
				initialData.loginData,
				communityAdminData,
				req,
			);

			if (!formattedPubData) {
				throw new Error('Pub Not Found');
			}

			/* We only want to get the branch doc if we're in document mode */
			/* otherwise, it's an extra call we don't need. */
			const getDocFunc = mode === 'document' ? getBranchDoc : () => ({});
			return Promise.all([
				formattedPubData,
				getDocFunc(
					formattedPubData.id,
					formattedPubData.activeBranch.id,
					req.params.versionNumber,
				),
			]);
		})
		.then(([formattedPubData, branchDocData]) => {
			const { content, historyData, mostRecentRemoteKey } = branchDocData;
			return {
				...formattedPubData,
				initialDoc: content,
				initialDocKey: mostRecentRemoteKey,
				historyData: historyData,
				citationData: generateCitationHTML(formattedPubData, initialData.communityData),
			};
		});
};
