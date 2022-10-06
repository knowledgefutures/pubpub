import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { fetchActivityItems } from 'server/activityItem/fetch';

app.get(
	['/dash/activity', '/dash/collection/:collectionSlug/activity', '/dash/pub/:pubSlug/activity'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}

			const initialData = await getInitialData(req, { isDashboard: true });
			const {
				scopeData: {
					scope,
					activePermissions: { canView },
				},
			} = initialData;

			if (!canView) {
				throw new ForbiddenError();
			}

			const activityData = await fetchActivityItems({ scope, limit: 50 });

			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardActivity"
					initialData={initialData}
					viewData={{ activityData }}
					headerComponents={generateMetaComponents({
						initialData,
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
