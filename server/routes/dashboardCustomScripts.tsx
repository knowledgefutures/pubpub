import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getCustomScriptsForCommunity } from 'server/customScript/queries';

app.get('/dash/scripts', async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			next();
		}
		const initialData = await getInitialData(req, { isDashboard: true });
		const { scopeData, communityData } = initialData;

		if (!scopeData.activePermissions.canAdminCommunity) {
			throw new ForbiddenError();
		}

		const customScripts = await getCustomScriptsForCommunity(communityData.id);
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardCustomScripts"
				initialData={initialData}
				viewData={{ customScripts }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Custom Scripts · ${communityData.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
