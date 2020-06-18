import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import {
	getPub,
	enrichPubFirebaseDoc,
	sanitizePub,
	enrichPubCitations,
} from 'server/utils/queryHelpers';

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

		const initialData = await getInitialData(req, true);
		const barePubData = await getPub(req.params.pubSlug, initialData.communityData.id);
		const pubData = await enrichPubFirebaseDoc(barePubData, null, 'draft');
		const sanitizedPub = await sanitizePub(pubData, initialData);
		const enrichedPub = await enrichPubCitations(sanitizedPub, initialData);

		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardOverview"
				initialData={initialData}
				viewData={{ pubData: enrichedPub }}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: `Overview · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
