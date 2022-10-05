import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getCustomScriptsForCommunity } from 'server/customScript/queries';

app.get('/*', async (req, res, next) => {
	try {
		res.status(404);
		const initialData = await getInitialData(req);
		const customScripts = await getCustomScriptsForCommunity(initialData.communityData.id);
		return renderToNodeStream(
			res,
			<Html
				chunkName="NoMatch"
				initialData={initialData}
				customScripts={customScripts}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Not Found · ${initialData.communityData.title}`,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
