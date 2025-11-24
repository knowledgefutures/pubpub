import type { Page } from 'types';

import React from 'react';

import { Router } from 'express';

import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import Html from 'server/Html';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getPage } from 'server/utils/queryHelpers';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get(['/', '/:slug'], async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}

	try {
		const initialData = await getInitialData(req);
		const pageId = initialData.communityData.pages.reduce(
			(bestId: string | undefined, nextPage: Page) => {
				if (nextPage.slug === '' && req.params.slug === undefined) {
					return nextPage.id;
				}
				if (nextPage.slug === req.params.slug) {
					return nextPage.id;
				}
				return bestId;
			},
			undefined,
		);

		if (!pageId) {
			return next();
		}

		const [customScripts, pageData] = await Promise.all([
			getCustomScriptsForCommunity(initialData.communityData.id),
			getPage({ query: { id: pageId }, initialData }),
		]);

		const pageTitle = !pageData.slug
			? initialData.communityData.title
			: `${pageData.title} · ${initialData.communityData.title}`;

		return renderToNodeStream(
			res,
			<Html
				chunkName="Page"
				initialData={initialData}
				viewData={{ pageData }}
				customScripts={customScripts}
				headerComponents={generateMetaComponents({
					initialData,
					title: pageTitle,
					description: pageData.description,
					image: pageData.avatar,
					unlisted: !pageData.isPublic,
				})}
				bodyClassPrefix="layout"
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
