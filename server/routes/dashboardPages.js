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
// import { getPages } from '../utils/queryHelpers';

app.get(['/dash/pages', '/dash/pages/:subMode'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, true);
		// const pagesData = await getPages(initialData);
		const pagesData = {};
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardPages"
				initialData={initialData}
				viewData={{ pagesData: pagesData }}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: `Pages · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
