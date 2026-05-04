import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { getAllHubsForDirectory } from 'server/hub/queries';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/hubs', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	try {
		const initialData = await getInitialData(req);

		// Hub directory is only visible to superadmins during private rollout
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const hubs = await getAllHubsForDirectory();

		return renderToNodeStream(
			res,
			<Html
				chunkName="HubDirectory"
				initialData={initialData}
				viewData={{ hubs }}
				headerComponents={generateMetaComponents({
					initialData,
					title: 'Hubs · PubPub',
					description: 'Explore the hubs building open knowledge communities on PubPub.',
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
