import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors, ForbiddenError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPage } from 'server/utils/queryHelpers';

app.get(['/dash/pages/:subMode'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, { isDashboard: true });

		if (!initialData.scopeData.activePermissions.canView) {
			throw new ForbiddenError();
		}

		const pageSlug = req.params.subMode === 'home' ? '' : req.params.subMode;
		const pageData = await getPage({
			query: { slug: pageSlug },
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
