import Promise from 'bluebird';
import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { Signup } from 'server/models';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

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
