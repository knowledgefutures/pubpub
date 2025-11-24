import React from 'react';

import { Router } from 'express';

import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import Html from 'server/Html';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/*', async (req, res, next) => {
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
