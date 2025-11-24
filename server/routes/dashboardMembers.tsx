import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getMembers } from 'server/utils/queryHelpers';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get(
	['/dash/members', '/dash/collection/:collectionSlug/members', '/dash/pub/:pubSlug/members'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, { isDashboard: true });
			if (!initialData.scopeData.elements.activeTarget) {
				throw new NotFoundError();
			}

			const membersData = await getMembers(initialData);

			if (!initialData.scopeData.activePermissions.canView) {
				throw new NotFoundError();
			}

			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardMembers"
					initialData={initialData}
					viewData={{ membersData }}
					headerComponents={generateMetaComponents({
						initialData,
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
