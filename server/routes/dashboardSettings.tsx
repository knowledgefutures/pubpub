import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors, ForbiddenError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPubForRequest } from 'server/utils/queryHelpers';

const getSettingsData = async (pubSlug, initialData) => {
	if (pubSlug) {
		return {
			pubData: await getPubForRequest({
				slug: pubSlug,
				initialData,
				getEdges: 'all',
			}),
		};
	}
	return {};
};

app.get(
	[
		'/dash/settings',
		'/dash/collection/:collectionSlug/settings',
		'/dash/pub/:pubSlug/settings',
		'/dash/settings/:subMode',
		'/dash/collection/:collectionSlug/settings/:subMode',
		'/dash/pub/:pubSlug/settings/:subMode',
	],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, { isDashboard: true });
			const settingsData = await getSettingsData(req.params.pubSlug, initialData);

			if (!initialData.scopeData.activePermissions.canView) {
				throw new ForbiddenError();
			}

			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardSettings"
					initialData={initialData}
					viewData={{ settingsData, subMode: req.params.subMode }}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Settings · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
