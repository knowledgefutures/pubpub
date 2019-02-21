import Promise from 'bluebird';
import React from 'react';
import UserCreate from 'containers/UserCreate/UserCreate';
import Html from '../Html';
import app from '../server';
import { Signup } from '../models';
import {
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';

app.get('/user/create/:hash', (req, res, next) => {
	const getSignup = Signup.findOne({
		where: { hash: req.params.hash, completed: false },
		attributes: ['email', 'hash'],
	});

	return Promise.all([getInitialData(req), getSignup])
		.then(([initialData, signupData]) => {
			const newInitialData = {
				...initialData,
				signupData: signupData || { hashError: true },
			};
			return renderToNodeStream(
				res,
				<Html
					chunkName="UserCreate"
					initialData={newInitialData}
					headerComponents={generateMetaComponents({
						initialData: newInitialData,
						title: `Create New user · ${newInitialData.communityData.title}`,
						unlisted: true,
					})}
				>
					<UserCreate {...newInitialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
