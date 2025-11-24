import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { User } from 'server/models';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get(['/password-reset', '/password-reset/:resetHash/:slug'], (req, res, next) => {
	const findUser = User.findOne({
		where: { slug: req.params.slug ?? null },
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
			if (
				userData &&
				userData.resetHashExpiration &&
				userData.resetHashExpiration < new Date()
			) {
				hashIsValid = false;
			}

			return renderToNodeStream(
				res,
				<Html
					chunkName="PasswordReset"
					initialData={initialData}
					viewData={{ passwordResetData: { hashIsValid } }}
					headerComponents={generateMetaComponents({
						initialData,
						title: 'Password Reset',
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
