/* eslint-disable import/prefer-default-export */
import { attributesPublicUser, checkIfSuperAdmin } from '.';
import { generateCitationHTML } from './citations';
import { getBranchDoc } from './firebaseAdmin';
import { getBranchAccess } from '../branch/permissions';
import {
	User,
	Pub,
	Discussion,
	CommunityAdmin,
	PubManager,
	PubAttribution,
	CollectionPub,
	Collection,
	Page,
	PubVersion,
	Branch,
	BranchPermission,
	Review,
	ReviewEvent,
} from '../models';

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
			const branchAccess = getBranchAccess(
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

	/* We want to make sure we only return pubs that can either be */
	/* directly edited, or have a viewable branch which has content on it */
	const canAccess = formattedBranches.reduce((prev, curr) => {
		if (curr.canEdit || (curr.canView && curr.firstKeyAt)) {
			return true;
		}
		return prev;
	}, false);

	if (!canAccess) {
		return null;
	}
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

	const reviews = pub.reviews || [];
	const discussions = pub.discussions || [];
	const collectionPubs = pub.collectionPubs || [];
	const formattedPubData = {
		...pub,
		branches: formattedBranches,
		activeBranch: activeBranch,
		attributions: pub.attributions.map((attribution) => {
			if (attribution.user) {
				return attribution;
			}

			/* When an attribution is only given a single name (i.e. no spaces) */
			/* we use the single name as a last name for citation purposes */
			const firstName = attribution.name.split(' ')[0];
			const lastName = attribution.name
				.split(' ')
				.slice(1, attribution.name.split(' ').length)
				.join(' ');
			return {
				...attribution,
				user: {
					id: attribution.id,
					initials: attribution.name[0],
					fullName: attribution.name,
					firstName: lastName ? firstName : '',
					lastName: lastName || firstName,
					avatar: attribution.avatar,
					title: attribution.title,
				},
			};
		}),
		reviews: reviews.filter((review) => {
			const sourceBranch =
				formattedBranches.find((branch) => {
					return branch.id === review.sourceBranchId;
				}) || {};
			const destinationBranch =
				formattedBranches.find((branch) => {
					return branch.id === review.destinationBranchId;
				}) || {};
			return sourceBranch.canManage || destinationBranch.canManage;
		}),
		discussions: discussions.filter((discussion) => {
			/* 
			Note: We currently return discussions on any
			branch the reader has access to. We only do this
			to enable discussionEmbeds in the short term. 
			Once we have a better solution to discussion embeds
			in a branch world, we should use the simpler commented
			line checking ===activeBranch.id below.
			*/
			const discussionBranch = formattedBranches.find((branch) => {
				return branch.id === discussion.branchId;
			});
			return discussionBranch && discussionBranch.canView;
			// return discussion.branchId === activeBranch.id;
		}),
		collectionPubs: collectionPubs.filter((item) => {
			return item.collection.isPublic || communityAdminData;
		}),
		canManage: canManagePub,
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
			{
				model: Review,
				as: 'reviews',
				include: [
					{
						model: ReviewEvent,
						as: 'reviewEvents',
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

			if (mode === 'merge') {
				/* Validate that the user has permissions to merge */
				/* and thus permissions to view this merge screen */
				const sourceBranch = formattedPubData.branches.find((branch) => {
					return branch.shortId === Number(req.params.fromBranchShortId);
				});
				const destinationBranch = formattedPubData.branches.find((branch) => {
					return branch.shortId === Number(req.params.toBranchShortId);
				});
				if (
					!sourceBranch ||
					!destinationBranch ||
					!sourceBranch.canView ||
					!destinationBranch.canManage
				) {
					throw new Error('Pub Not Found');
				}
			}

			if (mode === 'new review') {
				/* Validate that the user has permissions to create a review from */
				/* this branch and thus permissions to view this merge screen */
				const sourceBranch = formattedPubData.branches.find((branch) => {
					return branch.shortId === Number(req.params.fromBranchShortId);
				});
				if (!sourceBranch || !sourceBranch.canManage) {
					throw new Error('Pub Not Found');
				}
			}

			if (mode === 'review') {
				/* Validate that the user has permissions to view a review */
				/* and thus permissions to view this merge screen */
				const activeReview = formattedPubData.reviews.find((review) => {
					return review.shortId === Number(req.params.reviewShortId);
				});
				if (req.params.reviewShortId && !activeReview) {
					throw new Error('Pub Not Found');
				}
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
					true,
				),
			]);
		})
		.then(([formattedPubData, branchDocData]) => {
			const { content, historyData, mostRecentRemoteKey } = branchDocData;
			const outputData = {
				...formattedPubData,
				initialDoc: content,
				initialDocKey: mostRecentRemoteKey,
				historyData: historyData,
				citationData: generateCitationHTML(formattedPubData, initialData.communityData),
			};

			/* When getFirebaseDoc stores a checkpoint update, it also returns */
			/* checkpointUpdates, which has firstKeyAt and latestKeyAt. We take */
			/* those values and update the branch db row. There is likely a more */
			/* appropriate place for this update if/when we have a server-side */
			/* firebase doc validator. At the moment though, there isn't a great */
			/* place for this code since it feels flaky to have the client update */
			/* these values with API calls. */
			if (branchDocData.checkpointUpdates) {
				const whereQuery = { where: { id: outputData.activeBranch.id } };
				const setFirstKeyAt = outputData.activeBranch.firstKeyAt
					? undefined
					: Branch.update(
							{ firstKeyAt: branchDocData.checkpointUpdates.firstKeyAt },
							whereQuery,
					  );
				const setLatestKeyAt =
					new Date(outputData.activeBranch.latestKeyAt) >
					branchDocData.checkpointUpdates.latestKeyAt
						? undefined
						: Branch.update(
								{ latestKeyAt: branchDocData.checkpointUpdates.latestKeyAt },
								whereQuery,
						  );
				return Promise.all([outputData, setFirstKeyAt, setLatestKeyAt]);
			}
			return [outputData];
		})
		.then(([outputData]) => {
			return outputData;
		});
};

export const lookupPubVersion = async (versionId) => {
	const pubVersion = await PubVersion.findOne({
		where: { id: versionId },
		include: [
			{
				model: Branch,
				as: 'branch',
				required: true,
			},
		],
	});
	if (pubVersion) {
		return {
			shortId: pubVersion.branch.shortId,
			historyKey: pubVersion.historyKey,
		};
	}
	return null;
};
