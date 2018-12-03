import React from 'react';
import AdminDashboard from 'containers/AdminDashboard/AdminDashboard';
import Html from '../Html';
import app from '../server';
import { hostIsValid, renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';

app.get('/admin', (req, res, next)=> {
	if (!hostIsValid(req, 'pubpub')) { return next(); }
	return getInitialData(req)
	.then((initialData)=> {
		return renderToNodeStream(res,
			<Html
				chunkName="AdminDashboard"
				initialData={initialData}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: `Admin Dashboard · ${initialData.communityData.title}`,
					description: initialData.communityData.description,
				})}
			>
				<AdminDashboard {...initialData} />
			</Html>
		);
	})
	.catch(handleErrors(req, res, next));
});
