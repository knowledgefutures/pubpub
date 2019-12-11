import React from 'react';
import Promise from 'bluebird';
import { DashboardOverview } from 'containers';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utils';
import { getOverviewData } from '../utils/overviewQueries';

app.get(
	[
		'/dash',
		'/dash/overview',
		'/dash/collection/:collectionSlug',
		'/dash/collection/:collectionSlug/overview',
		'/dash/pub/:pubSlug',
		'/dash/pub/:pubSlug/overview',
	],
	(req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		if (!req.path.endsWith('overview')) {
			const splitUrl = req.originalUrl.split('?');
			const queryString = splitUrl.length > 1 ? `?${splitUrl[1]}` : '';
			return res.redirect(`${req.path}/overview${queryString}`);
		}

		return getInitialData(req, true)
			.then((initialData) => {
				return Promise.all([initialData, getOverviewData(initialData)]);
			})
			.then(([initialData, overviewData]) => {
				const inputData = {
					...initialData,
					overviewData: overviewData,
				};
				return renderToNodeStream(
					res,
					<Html
						chunkName="DashboardOverview"
						initialData={inputData}
						headerComponents={generateMetaComponents({
							initialData: initialData,
							title: `Overview · ${initialData.scopeData.activeTarget.title}`,
							unlisted: true,
						})}
					>
						<DashboardOverview {...inputData} />
					</Html>,
				);
			})
			.catch(handleErrors(req, res, next));
	},
);
