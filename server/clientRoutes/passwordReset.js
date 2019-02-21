import Promise from 'bluebird';
import React from 'react';
import PasswordReset from 'containers/PasswordReset/PasswordReset';
import Html from '../Html';
import app from '../server';
import { User } from '../models';
import {
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';

app.get(['/password-reset', '/password-reset/:resetHash/:slug'], (req, res, next) => {
	const findUser = User.findOne({
		where: { slug: req.params.slug },
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

			const newInitialData = {
				...initialData,
				passwordResetData: { hashIsValid: hashIsValid },
			};
			return renderToNodeStream(
				res,
				<Html
					chunkName="PasswordReset"
					initialData={newInitialData}
					headerComponents={generateMetaComponents({
						initialData: newInitialData,
						title: 'Password Reset',
					})}
				>
					<PasswordReset {...newInitialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
