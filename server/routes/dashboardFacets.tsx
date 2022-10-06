import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors, ForbiddenError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { fetchFacetsForScope } from 'server/facets';

app.get(
	['/dash/facets', '/dash/collection/:collectionSlug/facets', '/dash/pub/:pubSlug/facets'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, { isDashboard: true });
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
						title: `Facets · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
