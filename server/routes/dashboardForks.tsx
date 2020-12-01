import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
// import { getForks } from 'server/utils/queryHelpers';

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
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
					headerComponents={generateMetaComponents({
						initialData: initialData,
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'elements' does not exist on type '{ elem... Remove this comment to see the full error message
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
