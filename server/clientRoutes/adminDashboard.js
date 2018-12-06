import React from 'react';
import AdminDashboard from 'containers/AdminDashboard/AdminDashboard';
import Html from '../Html';
import app from '../server';
import { hostIsValid, renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';

app.get('/admin', (req, res, next)=> {
	if (!hostIsValid(req, 'pubpub')) { return next(); }
	return getInitialData(req)
	.then((initialData)=> {
		const user = req.user || {};
		const users = ['b242f616-7aaa-479c-8ee5-3933dcf70859', '5d9d63b3-6990-407c-81fb-5f87b9d3e360',
			'807f3604-4223-4495-b576-861d04d2f39e', '237fe275-0618-4a8f-bd40-ea9065836e67'];
		if (!users.includes(user.id)) { throw new Error('Page Not Found'); }
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
