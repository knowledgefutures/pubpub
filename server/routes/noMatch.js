import React from 'react';
import Html from '../Html';
import app from '../server';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utils';

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
