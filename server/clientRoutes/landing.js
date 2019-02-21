import React from 'react';
import Landing from 'containers/Landing/Landing';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';

app.get('/', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Landing"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: 'PubPub · Community Publishing',
						description: initialData.communityData.description,
					})}
				>
					<Landing {...initialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
