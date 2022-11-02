import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { generateMetabaseToken } from 'server/utils/metabase';

app.get(
	['/dash/impact', '/dash/collection/:collectionSlug/impact', '/dash/pub/:pubSlug/impact'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, { isDashboard: true });
			const { activeTargetType, activeTarget } = initialData.scopeData.elements;
			const impactData = {
				baseToken: generateMetabaseToken(activeTargetType, activeTarget.id, 'base'),
				benchmarkToken: generateMetabaseToken(
					activeTargetType,
					activeTarget.id,
					'benchmark',
				),
			};
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardImpact"
					initialData={initialData}
					viewData={{ impactData }}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Impact · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
