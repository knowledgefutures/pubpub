import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getMembers } from 'server/utils/queryHelpers';

app.get(
	['/dash/members', '/dash/collection/:collectionSlug/members', '/dash/pub/:pubSlug/members'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, true);
			const membersData = await getMembers(initialData);
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardMembers"
					initialData={initialData}
					viewData={{ membersData: membersData }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
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
