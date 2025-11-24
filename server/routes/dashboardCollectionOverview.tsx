import React from 'react';

import { Router } from 'express';
import queryString, { type ParsedQuery } from 'query-string';

import Html from 'server/Html';
import { SubmissionWorkflow } from 'server/models';
import { createUserScopeVisit } from 'server/userScopeVisit/queries';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getCollectionOverview } from 'server/utils/queryHelpers';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

const getSubmissionWorkflow = (collectionId: string) => {
	return SubmissionWorkflow.findOne({
		where: { collectionId },
	});
};

router.get('/dash/collection/:collectionSlug', (req, res) => {
	const { collectionSlug } = req.params;
	res.redirect(
		queryString.stringifyUrl({
			url: `/dash/collection/${collectionSlug}/overview`,
			query: req.query as ParsedQuery,
		}),
	);
});

router.get('/dash/collection/:collectionSlug/overview', async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			next();
		}
		const initialData = await getInitialData(req, { isDashboard: true });
		const {
			scopeData: {
				activePermissions: { canView },
				elements,
			},
		} = initialData;

		if (!elements.activeCollection) {
			throw new NotFoundError();
		}

		if (!canView && !elements.activeCollection!.isPublic) {
			throw new ForbiddenError();
		}

		const [overviewData, submissionWorkflow] = await Promise.all([
			getCollectionOverview(initialData),
			getSubmissionWorkflow(elements.activeCollection.id),
		]);

		const hasEnabledSubmissionWorkflow = submissionWorkflow && submissionWorkflow.enabled;

		const {
			communityData: { id: communityId },
			loginData: { id: userId },
		} = initialData;
		const {
			collection: { id: collectionId, title },
		} = overviewData;

		createUserScopeVisit({ userId, communityId, collectionId });

		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardCollectionOverview"
				initialData={initialData}
				viewData={{ overviewData, hasEnabledSubmissionWorkflow }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Overview · ${title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
