import React from 'react';
import Promise from 'bluebird';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utils';
import { getMembersData } from '../utils/membersQueries';

app.get(
	[
		'/dash/members',
		'/dash/collection/:collectionSlug',
		'/dash/collection/:collectionSlug/members',
		'/dash/pub/:pubSlug',
		'/dash/pub/:pubSlug/members',
	],
	(req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}

		return getInitialData(req, true)
			.then((initialData) => {
				return Promise.all([initialData, getMembersData(initialData)]);
			})
			.then(([initialData, membersData]) => {
				return renderToNodeStream(
					res,
					<Html
						chunkName="DashboardMembers"
						initialData={initialData}
						viewData={{ membersData: membersData }}
						headerComponents={generateMetaComponents({
							initialData: initialData,
							title: `Members · ${initialData.scopeData.activeTarget.title}`,
							unlisted: true,
						})}
					/>,
				);
			})
			.catch(handleErrors(req, res, next));
	},
);
