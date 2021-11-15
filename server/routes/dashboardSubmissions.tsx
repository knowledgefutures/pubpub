import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

app.get(['/dash/collection/:collectionSlug/submissions'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}

		const initialData = await getInitialData(req, true);
		if (!initialData.featureFlags.submissions) {
			return next();
		}

		const {
			scopeData: {
				activePermissions: { canManage },
			},
		} = initialData;

		if (!canManage) {
			throw new ForbiddenError();
		}

		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardSubmissions"
				initialData={initialData}
				viewData={{}}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Submissions · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
