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
// import { getDiscussions } from '../utils/queryHelpers';

app.get(
	[
		'/dash/discussions',
		'/dash/collection/:collectionSlug/discussions',
		'/dash/pub/:pubSlug/discussions',
	],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, true);
			// const discussionsData = await getDiscussions(initialData);
			const discussionsData = {};
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardDiscussions"
					initialData={initialData}
					viewData={{ discussionsData: discussionsData }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Discussions · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
