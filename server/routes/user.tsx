import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { getUser } from 'server/utils/queryHelpers';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

app.get(['/user/:slug', '/user/:slug/:mode'], async (req, res, next) => {
	try {
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
		const initialData = await getInitialData(req);
		const userData = await getUser(req.params.slug, initialData);
		const isNewishUser = Date.now() - userData.createdAt.valueOf() < 1000 * 86400 * 30;
		return renderToNodeStream(
			res,
			<Html
				chunkName="User"
				initialData={initialData}
				viewData={{ userData: userData }}
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
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
