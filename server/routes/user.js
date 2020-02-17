import React from 'react';
import Html from '../Html';
import app from '../server';
import { getUser } from '../utils/queryHelpers';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utils';

app.get(['/user/:slug', '/user/:slug/:mode'], async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		const userData = await getUser(req.params.slug, initialData);
		const isNewishUser = Date.now() - userData.createdAt.valueOf() < 1000 * 86400 * 30;
		return renderToNodeStream(
			res,
			<Html
				chunkName="User"
				initialData={initialData}
				viewData={{ userData: userData }}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: `${userData.fullName} · PubPub`,
					description: userData.bio,
					image: userData.avatar,
					canonicalUrl: `https://www.pubpub.org/user/${userData.slug}`,
					unlisted: isNewishUser,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
