import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPage } from 'server/utils/queryHelpers';

app.get(['/dash/pages/:subMode'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, true);
		const pageSlug = req.params.subMode === 'home' ? '' : req.params.subMode;
		const pageData = await getPage({
			query: { slug: pageSlug },
			forLayoutEditor: true,
			initialData,
		});
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardPage"
				initialData={initialData}
				viewData={{ pageData }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Pages · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
