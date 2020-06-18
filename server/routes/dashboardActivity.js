import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
// import { getActivity } from 'server/utils/queryHelpers';

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
