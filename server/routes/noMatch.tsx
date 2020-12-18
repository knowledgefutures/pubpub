import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

app.get('/*', (req, res, next) => {
	res.status(404);

	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="NoMatch"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Not Found · ${initialData.communityData.title}`,
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
