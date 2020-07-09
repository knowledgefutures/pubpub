import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getOverview, sanitizeOverview } from 'server/utils/queryHelpers';

app.get(
	['/dash/reviews', '/dash/collection/:collectionSlug/reviews', '/dash/pub/:pubSlug/reviews'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, true);
			const overviewData = await getOverview(initialData.scopeData.elements);
			const sanitizedOverviewData = await sanitizeOverview(initialData, overviewData);
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardReviews"
					initialData={initialData}
					viewData={{ overviewData: sanitizedOverviewData }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Reviews · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
