import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { getAllOrgsForDirectory } from 'server/org/queries';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/orgs', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	try {
		const initialData = await getInitialData(req);

		// Org directory is only visible to superadmins during private rollout
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}

		const orgs = await getAllOrgsForDirectory();

		return renderToNodeStream(
			res,
			<Html
				chunkName="OrgDirectory"
				initialData={initialData}
				viewData={{ orgs }}
				headerComponents={generateMetaComponents({
					initialData,
					title: 'Orgs · PubPub',
					description: 'Explore the orgs building open knowledge communities on PubPub.',
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
