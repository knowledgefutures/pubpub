import React from 'react';
import queryString from 'query-string';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getCollectionOverview } from 'server/utils/queryHelpers';

app.get('/dash/collection/:collectionSlug', (req, res) => {
	const { collectionSlug } = req.params;
	res.redirect(
		queryString.stringifyUrl({
			url: `/dash/collection/${collectionSlug}/overview`,
			query: req.query,
		}),
	);
});

app.get('/dash/collection/:collectionSlug/overview', async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			next();
		}
		const initialData = await getInitialData(req, true);
		const overviewData = await getCollectionOverview(initialData);
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardCollectionOverview"
				initialData={initialData}
				viewData={{ overviewData }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Overview · ${overviewData.collection.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
