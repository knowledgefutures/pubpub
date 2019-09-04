/* eslint-disable import/prefer-default-export */
import { buildSchema, jsonToNode, getNotes } from '@pubpub/editor';

import discussionSchema from 'containers/Pub/PubDocument/DiscussionAddon/discussionSchema';
import {
	Branch,
	BranchPermission,
	Collection,
	CollectionAttribution,
	CollectionPub,
	CommunityAdmin,
	Discussion,
	Page,
	Pub,
	PubAttribution,
	PubManager,
	PubVersion,
	Review,
	ReviewEvent,
	User,
} from '../models';
import { generateCiteHtmls } from '../editor/queries';

import { attributesPublicUser } from '.';
import { generateCitationHTML } from './citations';
import { getBranchDoc } from './firebaseAdmin';
import { formatAndAuthenticatePub } from './formatPub';

export const findPubQuery = (slug, communityId) =>
	Pub.findOne({
		where: {
			slug: slug,
			communityId: communityId,
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
							{
								model: CollectionAttribution,
								as: 'attributions',
								include: [
									{
										model: User,
										as: 'user',
									},
								],
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

export const findPub = (req, initialData, mode) => {
	const getPubData = findPubQuery(req.params.slug.toLowerCase(), initialData.communityData.id);

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
			const formattedPubData = formatAndAuthenticatePub({
				pub: pubDataJson,
				loginData: initialData.loginData,
				communityAdminData: communityAdminData,
				accessHash: req.query.access,
				branchShortId: req.params.branchShortId,
				versionNumber: req.params.versionNumber,
			});

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
			const { content } = branchDocData;
			const { footnotes: footnotesRaw, citations: citationsRaw } = content
				? getNotes(jsonToNode(content, buildSchema({ ...discussionSchema }, {})))
				: { footnotes: [], citations: [] };
			/* eslint-disable-next-line no-console */
			console.time('citationRenderTime');
			return Promise.all([
				formattedPubData,
				branchDocData,
				generateCiteHtmls(footnotesRaw),
				generateCiteHtmls(citationsRaw),
				generateCitationHTML(formattedPubData, initialData.communityData),
			]);
		})
		.then(([formattedPubData, branchDocData, footnotesData, citationsData, citationHtml]) => {
			/* eslint-disable-next-line no-console */
			console.timeEnd('citationRenderTime');
			const { content, historyData, mostRecentRemoteKey } = branchDocData;
			const outputData = {
				...formattedPubData,
				footnotes: footnotesData,
				citations: citationsData,
				initialDoc: content,
				initialDocKey: mostRecentRemoteKey,
				historyData: historyData,
				citationData: citationHtml,
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
