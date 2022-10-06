import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors, ForbiddenError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateCitationHtml } from 'server/utils/citations';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPubForRequest } from 'server/utils/queryHelpers';
import { createUserScopeVisit } from 'server/userScopeVisit/queries';

app.get(['/dash/pub/:pubSlug', '/dash/pub/:pubSlug/overview'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		if (!req.path.endsWith('overview')) {
			const splitUrl = req.originalUrl.split('?');
			const queryString = splitUrl.length > 1 ? `?${splitUrl[1]}` : '';
			return res.redirect(`${req.path}/overview${queryString}`);
		}

		const initialData = await getInitialData(req, { isDashboard: true });
		const pubData = await getPubForRequest({
			slug: req.params.pubSlug,
			initialData,
			getDraft: true,
			getDiscussions: true,
			getReviews: true,
		});

		if (!pubData) {
			throw new ForbiddenError();
		}

		const citationData = await generateCitationHtml(pubData, initialData.communityData);
		const {
			communityData: { id: communityId },
			loginData: { id: userId },
		} = initialData;
		createUserScopeVisit({ userId, communityId, pubId: pubData.id });
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardPubOverview"
				initialData={initialData}
				viewData={{ pubData: { ...pubData, citationData } }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Overview · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
