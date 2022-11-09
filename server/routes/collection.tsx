import React from 'react';
import { Op } from 'sequelize';

import app from 'server/server';
import Html from 'server/Html';
import { createUserScopeVisit } from 'server/userScopeVisit/queries';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { enrichCollectionWithPubTokens, getLayoutPubsByBlock } from 'server/utils/layouts';
import {
	sequelize,
	Collection,
	Page,
	CollectionAttribution,
	includeUserModel,
} from 'server/models';
import { handleErrors } from 'server/utils/errors';
import { withValue } from 'utils/fp';
import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import { getEnabledSubmissionWorkflowForCollection } from 'server/submissionWorkflow/queries';
import * as types from 'types';
import { LayoutBlockSubmissionBanner } from 'utils/layout';

const findCollectionByPartialId = (maybePartialId: string) => {
	return Collection.findOne({
		where: [
			sequelize.where(sequelize.cast(sequelize.col('Collection.id'), 'varchar'), {
				[Op.iLike]: `${maybePartialId}%`,
			}),
		],
	});
};

const enrichCollectionWithAttributions = async (collection: types.Collection) => {
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

app.get(['/collection/:collectionSlug', '/:collectionSlug'], async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}

	try {
		const { collectionSlug } = req.params;
		const initialData = await getInitialData(req);
		const {
			communityData,
			communityData: { id: communityId },
			loginData: { id: userId },
		} = initialData;

		const collection = withValue(
			communityData.collections.find((c) => c.slug === collectionSlug),
			(c) => c && enrichCollectionWithPubTokens(c, initialData),
		);

		if (collection) {
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
					blocks: layout.blocks,
					initialData,
					collectionId,
				});

				const customScripts = await getCustomScriptsForCommunity(communityData.id);
				createUserScopeVisit({ userId, communityId, collectionId });
				return renderToNodeStream(
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
