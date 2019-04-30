/* eslint-disable import/prefer-default-export */
import { attributesPublicUser } from '../utils';
import { generateCitationHTML } from './citations';
import { getBranchDoc } from './firebaseAdmin';
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

export const formatAndAuthenticatePub = (pub, loginData, communityAdminData, req) => {
	/* Used to format pub JSON and to test */
	/* whether the user has permissions */
	const isPubPubAdmin = loginData.id === 'b242f616-7aaa-479c-8ee5-3933dcf70859';
	const isCommunityAdminManager = communityAdminData && pub.isCommunityAdminManaged;
	const allowedBranches = pub.branches
		.sort((foo, bar) => {
			if (foo.order < bar.order) {
				return -1;
			}
			if (foo.order > bar.order) {
				return 1;
			}
			return 0;
		})
		.filter((branch) => {
			const validViewHash = branch.viewHash === req.query.access;
			const validEditHash = branch.editHash === req.query.access;
			const hasHashAccess =
				branch.shortId === req.params.branchShortId && (validViewHash || validEditHash);
			const publicAccess = branch.publicPermissions !== 'none';
			if (publicAccess || hasHashAccess) {
				return true;
			}

			return branch.permissions.reduce((prev, curr) => {
				if (curr.userId === loginData.id) {
					return true;
				}
				return prev;
			}, false);
		});

	if (!allowedBranches.length) {
		return null;
	}
	const activeBranch = allowedBranches.reduce((prev, curr, index) => {
		if (index === 0) {
			return curr;
		}
		if (curr.shortId === Number(req.params.branchShortId)) {
			return curr;
		}
		return prev;
	}, undefined);

	const isValidViewHash = req.query.access === activeBranch.viewHash;
	const isValidEditHash = req.query.access === activeBranch.editHash;
	const isCommunityAdminViewer =
		communityAdminData && activeBranch.communityAdminPermissions === 'view';
	const isCommunityAdminEditor =
		communityAdminData && activeBranch.communityAdminPermissions === 'edit';
	const isCommunityAdminBranchAdmin =
		communityAdminData && activeBranch.communityAdminPermissions === 'admin';

	const isManager = pub.managers.reduce((prev, curr) => {
		if (curr.userId === loginData.id) {
			return true;
		}
		return prev;
	}, isCommunityAdminManager || isPubPubAdmin);

	const isBranchAdmin = activeBranch.permissions.reduce((prev, curr) => {
		if (curr.userId === loginData.id && curr.permissions === 'manage') {
			return true;
		}
		return prev;
	}, isCommunityAdminBranchAdmin);

	// TODO: Change these to canView, canEdit, canDiscuss
	const isViewer = activeBranch.permissions.reduce((prev, curr) => {
		if (curr.userId === loginData.id && curr.permissions === 'view') {
			return true;
		}
		return prev;
	}, isCommunityAdminViewer || isValidViewHash || activeBranch.publicPermissions === 'view');

	const isEditor = activeBranch.permissions.reduce((prev, curr) => {
		if (curr.userId === loginData.id && curr.permissions === 'edit') {
			return true;
		}
		return prev;
	}, isCommunityAdminEditor || isBranchAdmin || isValidEditHash || allowedBranches[0].publicPermissions === 'edit');

	/* Ensure access of some kind */
	/* TODO: Something weird here. There shouldn't be a case where you have a Pub Manager */
	/* who has no access to any branch, so I'm not sure isManager matters here */
	if (!isManager && !isEditor && !isViewer && !isBranchAdmin) {
		return null;
	}

	const formattedBranches = allowedBranches.map((branch) => {
		const isCurrBranchAdmin = branch.permissions.reduce((prev, curr) => {
			if (
				branch.id === curr.branchId &&
				curr.userId === loginData.id &&
				curr.permissions === 'manage'
			) {
				return true;
			}
			return prev;
		}, false);

		return {
			...branch,
			viewHash: isCurrBranchAdmin ? branch.viewHash : undefined,
			editHash: isCurrBranchAdmin ? branch.editHash : undefined,
			isActive: activeBranch.id === branch.id,
		};
	});
	const formattedPubData = {
		...pub,
		branches: formattedBranches,
		activeBranch: formattedBranches.reduce((prev, curr) => {
			if (curr.isActive) {
				return curr;
			}
			return prev;
		}, undefined),
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
		isManager: isManager,
		isEditor: isEditor,
		isViewer: isViewer,
		isBranchAdmin: isBranchAdmin,
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
						attributes: ['id', 'fullName', 'avatar', 'slug', 'initials', 'title'],
					},
				],
			},
			{
				// separate: true,
				model: Branch,
				as: 'branches',
				attributes: [
					'createdAt',
					'id',
					'shortId',
					'title',
					'description',
					'submissionAlias',
					'order',
					'communityAdminPermissions',
					'publicPermissions',
					'viewHash',
					'editHash',
				],
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
			return {
				...formattedPubData,
				initialDoc: branchDocData.content,
				initialDocKey: branchDocData.mostRecentRemoteKey,
				citationData: generateCitationHTML(formattedPubData, initialData.communityData),
			};
		});
};
