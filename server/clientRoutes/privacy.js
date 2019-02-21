import React from 'react';
import Privacy from 'containers/Privacy/Privacy';
import Html from '../Html';
import app from '../server';
import {
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';

app.get('/privacy', (req, res, next) => {
	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Privacy"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Privacy · ${initialData.communityData.title}`,
						description: initialData.communityData.description,
					})}
				>
					<Privacy {...initialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
