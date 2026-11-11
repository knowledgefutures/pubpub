import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/orgs/docs', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	try {
		const initialData = await getInitialData(req);

		return renderToNodeStream(
			res,
			<Html
				chunkName="OrgDocs"
				initialData={initialData}
				viewData={{}}
				headerComponents={generateMetaComponents({
					initialData,
					title: 'Org Documentation · PubPub',
					description:
						'Learn how to manage and configure your PubPub Org — communities, templates, analytics, and more.',
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
