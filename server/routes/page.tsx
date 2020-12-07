import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPage } from 'server/utils/queryHelpers';

app.get(['/', '/:slug'], async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}

	try {
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
		const initialData = await getInitialData(req);
		const pageId = initialData.communityData.pages.reduce((prev, curr) => {
			if (curr.slug === '' && req.params.slug === undefined) {
				return curr.id;
			}
			if (curr.slug === req.params.slug) {
				return curr.id;
			}
			return prev;
		}, undefined);

		if (!pageId) {
			return next();
		}
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ query: { id: any; }; initialDa... Remove this comment to see the full error message
		const pageData = await getPage({ query: { id: pageId }, initialData: initialData });
		const pageTitle = !pageData.slug
			? initialData.communityData.title
			: `${pageData.title} · ${initialData.communityData.title}`;

		return renderToNodeStream(
			res,
			<Html
				chunkName="Page"
				initialData={initialData}
				viewData={{ pageData: pageData }}
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
				headerComponents={generateMetaComponents({
					initialData: initialData,
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
