import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPage } from 'server/utils/queryHelpers';
import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import { Page } from 'types';

app.get(['/', '/:slug'], async (req, res, next) => {
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

		const customScripts = await getCustomScriptsForCommunity(initialData.communityData.id);
		const pageData = await getPage({ query: { id: pageId }, initialData });
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
