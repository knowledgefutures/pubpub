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
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'elements' does not exist on type '{ elem... Remove this comment to see the full error message
			const overviewData = await getOverview(initialData.scopeData.elements);
			const sanitizedOverviewData = await sanitizeOverview(initialData, overviewData);
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardReviews"
					initialData={initialData}
					viewData={{ overviewData: sanitizedOverviewData }}
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
					headerComponents={generateMetaComponents({
						initialData: initialData,
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'elements' does not exist on type '{ elem... Remove this comment to see the full error message
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
