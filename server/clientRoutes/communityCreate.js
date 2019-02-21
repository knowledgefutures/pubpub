import React from 'react';
import CommunityCreate from 'containers/CommunityCreate/CommunityCreate';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';

app.get('/community/create', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="CommunityCreate"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: 'Create New Community · PubPub',
					})}
				>
					<CommunityCreate {...initialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
