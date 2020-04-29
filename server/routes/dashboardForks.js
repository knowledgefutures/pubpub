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
// import { getForks } from '../utils/queryHelpers';

app.get(
	['/dash/forks', '/dash/collection/:collectionSlug/forks', '/dash/pub/:pubSlug/forks'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, true);
			// const forksData = await getForks(initialData);
			const forksData = {};
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardForks"
					initialData={initialData}
					viewData={{ forksData: forksData }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Forks · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
