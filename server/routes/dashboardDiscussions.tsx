import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
// import { getDiscussions } from 'server/utils/queryHelpers';

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
