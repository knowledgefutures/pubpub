import React from 'react';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utils';
import { getReview, sanitizeReviews } from '../utils/queryHelpers';

app.get(['/dash/pub/:pubSlug/reviews/:reviewNumber'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, true);
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
					initialData: initialData,
					title: `Review ${req.params.reviewNumber} · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
