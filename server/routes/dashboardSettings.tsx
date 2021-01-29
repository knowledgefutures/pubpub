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
		return getPubForRequest({
			slug: pubSlug,
			initialData: initialData,
			getEdges: 'all',
		});
	}
	return {};
};

app.get(
	['/dash/settings', '/dash/collection/:collectionSlug/settings', '/dash/pub/:pubSlug/settings'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, true);
			const settingsData = await getSettingsData(req.params.pubSlug, initialData);

			if (!initialData.scopeData.activePermissions.canView) {
				throw new ForbiddenError();
			}

			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardSettings"
					initialData={initialData}
					viewData={{ settingsData: settingsData }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
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
