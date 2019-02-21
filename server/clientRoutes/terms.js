import React from 'react';
import Terms from 'containers/Terms/Terms';
import Html from '../Html';
import app from '../server';
import {
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';

app.get('/tos', (req, res, next) => {
	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Terms"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Terms of Service · ${initialData.communityData.title}`,
						description: initialData.communityData.description,
					})}
				>
					<Terms {...initialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
