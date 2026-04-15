import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get(
	['/dash/impact2', '/dash/collection/:collectionSlug/impact2', '/dash/pub/:pubSlug/impact2'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, { isDashboard: true });
			if (!initialData.scopeData.elements.activeTarget) {
				throw new NotFoundError();
			}
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardImpact2"
					initialData={initialData}
					viewData={{}}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Impact · ${initialData.scopeData.elements.activeTarget.title ?? initialData.communityData.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
