import Promise from 'bluebird';
import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { User } from 'server/models';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

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
