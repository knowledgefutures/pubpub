import { Op } from 'sequelize';
import React from 'react';

import app from 'server/server';
import Html from 'server/Html';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { enrichCollectionWithPubTokens, getPubsForLayout } from 'server/utils/queryHelpers/layout';
import {
	sequelize,
	Collection,
	Page,
	CollectionAttribution,
	includeUserModel,
} from 'server/models';
import { handleErrors } from 'server/utils/errors';
import { withValue } from 'utils/fp';

const findCollectionByPartialId = (maybePartialId) => {
	return Collection.findOne({
		where: [
			sequelize.where(sequelize.cast(sequelize.col('Collection.id'), 'varchar'), {
				[Op.iLike]: `${maybePartialId}%`,
			}),
		],
	});
};

const enrichCollectionWithAttributions = async (collection) => {
	collection.attributions = await CollectionAttribution.findAll({
		where: { collectionId: collection.id },
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ as: string; }' is not assignab... Remove this comment to see the full error message
		include: [includeUserModel({ as: 'user' })],
	});
};

app.get(['/collection/:collectionSlug', '/:collectionSlug'], async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}

	try {
		const { collectionSlug } = req.params;
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
		const initialData = await getInitialData(req);
		const { communityData } = initialData;

		const collection = withValue(
			communityData.collections.find((c) => c.slug === collectionSlug),
			(c) => c && enrichCollectionWithPubTokens(c, initialData),
		);

		if (collection) {
			const { pageId, layout } = collection;

			await enrichCollectionWithAttributions(collection);

			if (pageId) {
				const page = await Page.findOne({ where: { id: pageId } });
				if (page) {
					return res.redirect(`/${page.slug}`);
				}
			}

			if (layout) {
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ blocks: any; initialData: { co... Remove this comment to see the full error message
				const pubs = await getPubsForLayout({
					blocks: layout.blocks,
					initialData: initialData,
					collectionId: collection.id,
				});

				return renderToNodeStream(
					res,
					<Html
						chunkName="Collection"
						initialData={initialData}
						viewData={{ pubs: pubs, collection: collection }}
						// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
						headerComponents={generateMetaComponents({
							initialData: initialData,
							title: `${collection.title} · ${communityData.title}`,
							description: '',
							image: collection.avatar,
							unlisted: !collection.isPublic,
						})}
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
