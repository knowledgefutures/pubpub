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
// import { getSettings } from '../utils/queryHelpers';

app.get(
	['/dash/settings', '/dash/collection/:collectionSlug/settings', '/dash/pub/:pubSlug/settings'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, true);
			// const settingsData = await getSettings(initialData);
			const settingsData = {};
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardSettings"
					initialData={initialData}
					viewData={{ settingsData: settingsData }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Settings · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
