import type * as types from 'types';
import type { LayoutBlockSubmissionBanner } from 'utils/layout';

import React from 'react';

import { Router } from 'express';
import { Op } from 'sequelize';

import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import Html from 'server/Html';
import { Collection, CollectionAttribution, includeUserModel, Page } from 'server/models';
import { sequelize } from 'server/sequelize';
import { getEnabledSubmissionWorkflowForCollection } from 'server/submissionWorkflow/queries';
import { createUserScopeVisit } from 'server/userScopeVisit/queries';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { enrichCollectionWithPubTokens, getLayoutPubsByBlock } from 'server/utils/layouts';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { withValue } from 'utils/fp';

export const router = Router();

const findCollectionByPartialId = (maybePartialId: string) => {
	return Collection.findOne({
		where: [
			sequelize.where(sequelize.cast(sequelize.col('Collection.id'), 'varchar'), {
				[Op.iLike]: `${maybePartialId}%`,
			}),
		],
	});
};

const enrichCollectionWithAttributions = async (collection: Collection) => {
	collection.attributions = await CollectionAttribution.findAll({
		where: { collectionId: collection.id },
		include: [includeUserModel({ as: 'user' })],
	});
};

const getLayoutWithSubmissionWorkflowBlock = async (collection: types.Collection) => {
	const { layout, id: collectionId } = collection;
	if (layout) {
		const workflow = await getEnabledSubmissionWorkflowForCollection(collectionId);
		if (workflow?.enabled) {
			const [firstBlock] = layout.blocks;
			const { title, introText, id: submissionWorkflowId } = workflow;
			const firstBlockIsHeader = firstBlock?.type === 'collection-header';
			const bannerBlockIndex = firstBlockIsHeader ? 1 : 0;
			const bannerBlock: LayoutBlockSubmissionBanner = {
				id: workflow.id,
				type: 'submission-banner',
				content: {
					title,
					submissionWorkflowId,
					body: introText,
				},
			};
			const nextBlocks = [...layout.blocks];
			nextBlocks.splice(bannerBlockIndex, 0, bannerBlock);
			return {
				...layout,
				blocks: nextBlocks,
			};
		}
	}
	return layout;
};

router.get(['/collection/:collectionSlug', '/:collectionSlug'], async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}

	try {
		const { collectionSlug } = req.params;

		const initialData = await getInitialData(req);
		(req as any).initialData = initialData;

		const {
			communityData,
			communityData: { id: communityId },
			loginData: { id: userId },
			scopeData: {
				elements: { activeCollection },
			},
		} = initialData;

		const isCollectionAccessible = communityData.collections.find(
			(c) => c.slug === collectionSlug,
		);

		const collection = withValue(
			activeCollection,
			(c) => c && enrichCollectionWithPubTokens(c, initialData),
		);

		if (collection && isCollectionAccessible) {
			const { pageId, id: collectionId } = collection;
			await enrichCollectionWithAttributions(collection);

			if (pageId) {
				const page = await Page.findOne({ where: { id: pageId } });
				if (page) {
					return res.redirect(`/${page.slug}`);
				}
			}

			const layout = await getLayoutWithSubmissionWorkflowBlock(collection);
			if (layout) {
				const layoutPubsByBlock = await getLayoutPubsByBlock({
					allowDuplicatePubs: collection.layoutAllowsDuplicatePubs,
					blocks: layout.blocks,
					initialData,
					collectionId,
				});

				const customScripts = await getCustomScriptsForCommunity(communityData.id);
				createUserScopeVisit({ userId, communityId, collectionId });

				const out = renderToNodeStream(
					res,
					<Html
						chunkName="Collection"
						initialData={initialData}
						viewData={{ layoutPubsByBlock, collection, layout }}
						customScripts={customScripts}
						headerComponents={generateMetaComponents({
							initialData,
							title: `${collection.title} · ${communityData.title}`,
							description: '',
							image: collection.avatar,
							unlisted: !collection.isPublic,
							collection,
						})}
						bodyClassPrefix="layout"
					/>,
				);
				return out;
			}

			return res.redirect(`/search?q=${collection.title}`);
		}

		// Some Crossref deposits have occured with this scheme so we must continue
		// to support it. This only applies to URLs that match the /collection/:slug
		// pattern.
		if (/^\/collection/.test(req.path)) {
			const collectionByPartialId = await findCollectionByPartialId(collectionSlug);

			if (collectionByPartialId) {
				return res.redirect(`/${collectionByPartialId.slug}`);
			}
		}
		return next();
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
