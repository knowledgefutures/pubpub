import React from 'react';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utils';
import { getPage } from '../utils/queryHelpers';

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
		const pageData = await getPage(pageId, initialData);
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
