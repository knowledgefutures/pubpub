import React from 'react';
import Promise from 'bluebird';
import Dashboard from 'containers/Dashboard/Dashboard';
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

app.get(['/dashboard', '/dashboard/:mode', '/dashboard/:mode/:slug'], (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	if (!req.params.mode) {
		return res.redirect('/dashboard/pubs');
	}
	return getInitialData(req)
		.then((initialData) => {
			if (!initialData.loginData.isAdmin) {
				throw new Error('User Not Admin');
			}

			const slug = initialData.locationData.params.slug || '';
			const mode = initialData.locationData.params.mode;
			const activeItem = {};
			if (mode === 'activity') {
				activeItem.title = 'Activity';
			}
			if (mode === 'team') {
				activeItem.title = 'Team';
			}
			if (mode === 'settings') {
				activeItem.title = 'Settings';
			}
			if (mode === 'tags') {
				activeItem.title = 'Tags';
			}
			if (mode === 'pubs') {
				activeItem.title = 'Pubs';
			}
			if (mode === 'page') {
				activeItem.title = 'New Page';
			}

			const pageId = initialData.communityData.pages.reduce((prev, curr) => {
				if (mode === 'pages' && !slug && !curr.slug) {
					return curr.id;
				}
				if (curr.slug === slug) {
					return curr.id;
				}
				return prev;
			}, undefined);

			if (!pageId && !activeItem.title) {
				throw new Error('Page Not Found');
			}

			const findPageData = activeItem.title
				? activeItem
				: findPage(pageId, true, initialData);

			const findPubs =
				mode === 'pubs'
					? findPage(initialData.communityData.pages[0].id, true, initialData)
					: { pubs: [] };

			return Promise.all([initialData, findPageData, findPubs]);
		})
		.then(([initialData, pageData, pubsData]) => {
			const newInitialData = {
				...initialData,
				pageData: pageData,
				pubsData: pubsData.pubs,
			};
			return renderToNodeStream(
				res,
				<Html
					chunkName="Dashboard"
					initialData={newInitialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `${pageData.title} · Dashboard`,
						unlisted: true,
					})}
				>
					<Dashboard {...newInitialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
