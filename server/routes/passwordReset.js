import Promise from 'bluebird';
import React from 'react';
import Html from '../Html';
import app from '../server';
import { User } from '../models';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utils';

app.get(['/password-reset', '/password-reset/:resetHash/:slug'], (req, res, next) => {
	const findUser = User.findOne({
		where: { slug: req.params.slug || null },
	});

	return Promise.all([getInitialData(req), findUser])
		.then(([initialData, userData]) => {
			let hashIsValid = true;
			if (!userData) {
				hashIsValid = false;
			}
			if (userData && userData.resetHash !== req.params.resetHash) {
				hashIsValid = false;
			}
			if (userData && userData.resetHashExpiration < Date.now()) {
				hashIsValid = false;
			}

			return renderToNodeStream(
				res,
				<Html
					chunkName="PasswordReset"
					initialData={initialData}
					viewData={{ passwordResetData: { hashIsValid: hashIsValid } }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: 'Password Reset',
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
