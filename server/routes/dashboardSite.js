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
// import { getSite } from '../utils/queryHelpers';

app.get(['/dash/site'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, true);
		// const siteData = await getSite(initialData);
		const siteData = {};
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardSite"
				initialData={initialData}
				viewData={{ siteData: siteData }}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: `Site · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
