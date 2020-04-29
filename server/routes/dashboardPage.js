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
import { getPage } from '../utils/queryHelpers';

app.get(['/dash/pages/:subMode'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, true);
		const pageSlug = req.params.subMode === 'home' ? '' : req.params.subMode;
		const pageData = await getPage({ slug: pageSlug }, initialData);
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardPage"
				initialData={initialData}
				viewData={{ pageData: pageData }}
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
