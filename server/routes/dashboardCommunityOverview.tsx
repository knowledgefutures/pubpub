import React from 'react';

import { Router } from 'express';
import queryString, { type ParsedQuery } from 'query-string';

import Html from 'server/Html';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getCommunityOverview } from 'server/utils/queryHelpers';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/dash', (req, res) => {
	res.redirect(
		queryString.stringifyUrl({
			url: '/dash/overview',
			query: req.query as ParsedQuery,
		}),
	);
});

router.get('/dash/overview', async (req, res, next) => {
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
