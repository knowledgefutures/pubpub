import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

app.get('/pricing', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Pricing"
					initialData={initialData}
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: 'Pricing · PubPub',
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
