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
import {
	findPage,
	getCollectionAttributions,
	getCollectionPubsInCollection,
} from '../queryHelpers';

const extraContextualData = [
	{
		retrieve: ({ initialData, mode }) => {
			if (['collections', 'pubs'].includes(mode)) {
				// TODO(ian): this looks like a bit of a hack, we should maybe just query for pubs?
				return findPage(initialData.communityData.pages[0].id, true, initialData);
			}
			return { pubs: [] };
		},
		transform: (initialData, result) => ({
			...initialData,
			pubsData: result.pubs,
		}),
	},
	{
		retrieve: ({ activeItem, initialData, pageId }) => {
			if (activeItem.title) {
				return activeItem;
			}
			return findPage(pageId, true, initialData);
		},
		transform: (initialData, result) => ({
			...initialData,
			pageData: result,
		}),
	},
	{
		retrieve: ({ mode, slug: collectionId }) => {
			if (mode === 'collections' && collectionId) {
				return Promise.all([
					getCollectionAttributions(collectionId),
					getCollectionPubsInCollection(collectionId),
				]);
			}
			return null;
		},
		transform: (initialData, result, { slug: collectionId }) => {
			const { communityData } = initialData;
			const { collections } = communityData;
			if (!result) {
				return initialData;
			}
			const [attributions, collectionPubs] = result;
			const newCollections = collections.map((collection) => {
				if (collection.id === collectionId) {
					return {
						...collection,
						attributions: attributions,
						collectionPubs: collectionPubs,
					};
				}
				return collection;
			});
			return {
				...initialData,
				communityData: {
					...communityData,
					collections: newCollections,
				},
			};
		},
	},
];

const addExtraData = (initialDataPromise, context) =>
	Promise.all([
		initialDataPromise,
		...extraContextualData.map(
			({ retrieve, transform }) =>
				new Promise((resolve, reject) => {
					const retrieved = retrieve(context);
					const resolveWithTransformer = (result) =>
						resolve((initialData) => transform(initialData, result, context));
					if (retrieved && typeof retrieved.then === 'function') {
						return retrieved
							.then((result) => resolveWithTransformer(result))
							.catch((err) => reject(err));
					}
					return resolveWithTransformer(retrieved);
				}),
		),
	]).then(([initialData, ...transformers]) =>
		transformers.reduce((data, nextTransformer) => nextTransformer(data), initialData),
	);

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
			if (mode === 'collections') {
				activeItem.title = 'Collections';
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

			return addExtraData(initialData, {
				activeItem: activeItem,
				initialData: initialData,
				mode: mode,
				pageId: pageId,
				slug: slug,
			});
		})
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Dashboard"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `${initialData.pageData.title} · Dashboard`,
						unlisted: true,
					})}
				>
					<Dashboard {...initialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
