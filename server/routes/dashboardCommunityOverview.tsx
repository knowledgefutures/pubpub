import React from 'react';
import queryString from 'query-string';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getCommunityOverview } from 'server/utils/queryHelpers';

app.get('/dash', (req, res) => {
	res.redirect(queryString.stringifyUrl({ url: '/dash/overview', query: req.query }));
});

app.get('/dash/overview', async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			next();
		}
		const initialData = await getInitialData(req, { isDashboard: true });
		const overviewData = await getCommunityOverview(initialData);
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardCommunityOverview"
				initialData={initialData}
				viewData={{ overviewData }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Overview · ${initialData.communityData.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
