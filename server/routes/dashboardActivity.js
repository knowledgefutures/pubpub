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
// import { getActivity } from '../utils/queryHelpers';

app.get(
	['/dash/activity', '/dash/collection/:collectionSlug/activity', '/dash/pub/:pubSlug/activity'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, true);
			// const activityData = await getActivity(initialData);
			const activityData = {};
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardActivity"
					initialData={initialData}
					viewData={{ activityData: activityData }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Activity · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
