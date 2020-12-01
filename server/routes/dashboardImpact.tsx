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
			const initialData = await getInitialData(req, true);
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'elements' does not exist on type '{ elem... Remove this comment to see the full error message
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
					viewData={{ impactData: impactData }}
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
					headerComponents={generateMetaComponents({
						initialData: initialData,
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'elements' does not exist on type '{ elem... Remove this comment to see the full error message
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
