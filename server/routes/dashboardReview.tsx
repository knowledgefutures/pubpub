import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getReview, sanitizeReviews } from 'server/utils/queryHelpers';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get(['/dash/pub/:pubSlug/reviews/:reviewNumber'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, { isDashboard: true });
		const { scopeData, loginData } = initialData;
		if (!initialData.scopeData.elements.activeTarget) {
			throw new NotFoundError();
		}
		const { pubSlug, reviewNumber } = req.params;
		const reviewData = await getReview(
			pubSlug,
			parseInt(reviewNumber, 10),
			initialData.communityData.id,
		);
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
					title: `Review ${req.params.reviewNumber} · ${initialData.scopeData.elements.activeTarget?.title ?? initialData.communityData.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
