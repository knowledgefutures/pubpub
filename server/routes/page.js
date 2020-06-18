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
			throw new Error('Page Not Found');
		}
		const pageData = await getPage({ id: pageId }, initialData);
		const pageTitle = !pageData.slug
			? initialData.communityData.title
			: `${pageData.title} · ${initialData.communityData.title}`;

		return renderToNodeStream(
			res,
			<Html
				chunkName="Page"
				initialData={initialData}
				viewData={{ pageData: pageData }}
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
