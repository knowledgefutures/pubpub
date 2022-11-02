import React from 'react';

import app, { wrap } from 'server/server';
import Html from 'server/Html';
import { handleErrors, ForbiddenError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';

import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPubForRequest } from 'server/utils/queryHelpers';

app.get(
	'/dash/pub/:pubSlug/connections',
	wrap(async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const { pubSlug } = req.params;
			const initialData = await getInitialData(req, { isDashboard: true });
			const pubData = await getPubForRequest({
				slug: pubSlug,
				initialData,
				getEdges: 'all',
			});

			if (!pubData) {
				throw new ForbiddenError();
			}

			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardEdges"
					initialData={initialData}
					viewData={{ pubData }}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Connections · ${pubData.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	}),
);
