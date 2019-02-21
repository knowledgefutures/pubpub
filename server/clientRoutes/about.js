import React from 'react';
import About from 'containers/About/About';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';

app.get('/about', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="About"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: 'About PubPub',
					})}
				>
					<About {...initialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
