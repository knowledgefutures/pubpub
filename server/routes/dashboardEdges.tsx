import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getPubForRequest } from 'server/utils/queryHelpers';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { wrap } from 'server/wrap';

export const router = Router();

router.get(
	'/dash/pub/:pubSlug/connections',
	wrap(async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const { pubSlug } = req.params;
			const initialData = await getInitialData(req, { isDashboard: true });
			if (!initialData.scopeData.elements.activeTarget) {
				throw new NotFoundError();
			}
			const pubData = await getPubForRequest({
				slug: pubSlug,
				initialData,
				getEdges: 'all',
			});

			if (!pubData) {
				throw new ForbiddenError();
			}

			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardEdges"
					initialData={initialData}
					viewData={{ pubData }}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Connections · ${pubData.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	}),
);
