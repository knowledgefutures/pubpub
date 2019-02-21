import React from 'react';
import Promise from 'bluebird';
import PageContainer from 'containers/Page/Page';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';
import { findPage } from '../queryHelpers';

app.get(['/', '/:slug'], (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}

	return getInitialData(req)
		.then((initialData) => {
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

			return Promise.all([initialData, findPage(pageId, true, initialData)]);
		})
		.then(([initialData, pageData]) => {
			const newInitialData = {
				...initialData,
				pageData: pageData,
			};
			const pageTitle = !pageData.slug
				? newInitialData.communityData.title
				: `${pageData.title} · ${newInitialData.communityData.title}`;
			return renderToNodeStream(
				res,
				<Html
					chunkName="Page"
					initialData={newInitialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: pageTitle,
						description: pageData.description,
						image: pageData.avatar,
						unlisted: !pageData.isPublic,
					})}
				>
					<PageContainer {...newInitialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
