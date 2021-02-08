import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPage } from 'server/utils/queryHelpers';
import { Page } from 'utils/types';

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
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ query: { id: any; }; initialDa... Remove this comment to see the full error message
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
				headerComponents={generateMetaComponents({
					initialData,
					title: pageTitle,
					description: pageData.description,
					image: pageData.avatar,
					unlisted: !pageData.isPublic,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
