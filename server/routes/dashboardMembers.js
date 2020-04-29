import React from 'react';
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
	['/dash/members', '/dash/collection/:collectionSlug/members', '/dash/pub/:pubSlug/members'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, true);
			const membersData = await getMembers(initialData);
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
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
