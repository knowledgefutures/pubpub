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
import { getMembers } from '../utils/queryHelpers';

app.get(
	[
		'/dash/members',
		'/dash/collection/:collectionSlug',
		'/dash/collection/:collectionSlug/members',
		'/dash/pub/:pubSlug',
		'/dash/pub/:pubSlug/members',
	],
	(req, res, next) => {
		console.log('---------');
		console.time('total');
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		console.time('intial');
		return getInitialData(req, true)
			.then((initialData) => {
				console.timeEnd('intial');
				console.time('members');
				return Promise.all([initialData, getMembers(initialData)]);
			})
			.then(([initialData, membersData]) => {
				console.timeEnd('members');
				console.timeEnd('total');
				return renderToNodeStream(
					res,
					<Html
						chunkName="DashboardMembers"
						initialData={initialData}
						viewData={{ membersData: membersData }}
						headerComponents={generateMetaComponents({
							initialData: initialData,
							title: `Members · ${initialData.scopeData.elements.activeTarget.title}`,
							unlisted: true,
						})}
					/>,
				);
			})
			.catch(handleErrors(req, res, next));
	},
);
