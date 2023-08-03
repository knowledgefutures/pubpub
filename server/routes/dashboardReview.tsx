import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getReview, sanitizeReviews } from 'server/utils/queryHelpers';

app.get(['/dash/pub/:pubSlug/reviews/:reviewNumber'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, { isDashboard: true });
		const { scopeData, loginData } = initialData;
		const { pubSlug, reviewNumber } = req.params;
		const reviewData = await getReview(pubSlug, reviewNumber, initialData.communityData.id);
		const sanitizedReviewData = await sanitizeReviews(
			[reviewData],
			scopeData.activePermissions,
			loginData.id,
		)[0];
		if (!sanitizedReviewData) {
			throw new Error('Review Not Found');
		}
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardReview"
				initialData={initialData}
				viewData={{ reviewData: sanitizedReviewData }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Review ${req.params.reviewNumber} · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
