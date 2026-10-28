import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/orgs/pricing', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	try {
		const initialData = await getInitialData(req);

		return renderToNodeStream(
			res,
			<Html
				chunkName="OrgPricing"
				initialData={initialData}
				headerComponents={generateMetaComponents({
					initialData,
					title: 'Org Pricing · PubPub',
					description:
						'Pricing for PubPub Orgs — optional tooling for organizations that curate, coordinate, and report on publishing across multiple Communities.',
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
