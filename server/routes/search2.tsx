import type { InitialData } from 'types';

import React from 'react';

import { Router } from 'express';

import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import Html from 'server/Html';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/search', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		const customScripts = await getCustomScriptsForCommunity(initialData.communityData.id);

		return renderToNodeStream(
			res,
			<Html
				chunkName="Search2"
				initialData={initialData}
				customScripts={customScripts}
				viewData={{}}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Search · ${initialData.communityData.title}`,
					description: `Search for pubs and communities in ${initialData.communityData.title}`,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
