import Promise from 'bluebird';
import React from 'react';
import Html from '../Html';
import app from '../server';
import { Signup } from '../models';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utils';

app.get('/user/create/:hash', (req, res, next) => {
	const getSignup = Signup.findOne({
		where: { hash: req.params.hash, completed: false },
		attributes: ['email', 'hash'],
	});

	return Promise.all([getInitialData(req), getSignup])
		.then(([initialData, signupData]) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="UserCreate"
					initialData={initialData}
					viewData={{ signupData: signupData || { hashError: true } }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Create New user · ${initialData.communityData.title}`,
						unlisted: true,
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
