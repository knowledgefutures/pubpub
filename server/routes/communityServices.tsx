import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/community-services', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="CommunityServices"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData,
						title: 'Community Services · PubPub',
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
