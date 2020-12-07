import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

app.get('/signup', (req, res, next) => {
	// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Signup"
					initialData={initialData}
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Signup · ${initialData.communityData.title}`,
						description: initialData.communityData.description,
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
