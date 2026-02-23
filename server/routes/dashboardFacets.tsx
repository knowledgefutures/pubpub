import React from 'react';

import { Router } from 'express';

import { fetchFacetsForScope } from 'server/facets';
import Html from 'server/Html';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get(
	['/dash/facets', '/dash/collection/:collectionSlug/facets', '/dash/pub/:pubSlug/facets'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, { isDashboard: true });
			if (!initialData.scopeData.elements.activeTarget) {
				throw new NotFoundError();
			}
			const {
				scopeData: { activePermissions, scope },
			} = initialData;

			if (!activePermissions.canView) {
				throw new ForbiddenError();
			}

			const facets = await fetchFacetsForScope(scope);

			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardFacets"
					initialData={initialData}
					viewData={{ facets, scopeId: scope }}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Facets · ${initialData.scopeData.elements.activeTarget.title ?? initialData.communityData.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
