import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

app.get('/signup', (req, res, next) => {
	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Signup"
					initialData={initialData}
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
