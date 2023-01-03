import React from 'react';
import queryString, { ParsedQuery } from 'query-string';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors, ForbiddenError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getCollectionOverview } from 'server/utils/queryHelpers';
import { createUserScopeVisit } from 'server/userScopeVisit/queries';
import { SubmissionWorkflow } from 'server/models';
import { SubmissionWorkflow as SubmissionWorkflowType } from 'types';

const getSubmissionWorkflow = (collectionId: string): Promise<SubmissionWorkflowType> => {
	return SubmissionWorkflow.findOne({
		where: { collectionId },
	});
};

app.get('/dash/collection/:collectionSlug', (req, res) => {
	const { collectionSlug } = req.params;
	res.redirect(
		queryString.stringifyUrl({
			url: `/dash/collection/${collectionSlug}/overview`,
			query: req.query as ParsedQuery,
		}),
	);
});

app.get('/dash/collection/:collectionSlug/overview', async (req, res, next) => {
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

		if (!canView && !elements.activeCollection!.isPublic) {
			throw new ForbiddenError();
		}

		const overviewData = await getCollectionOverview(initialData);
		const submissionWorkflow = await getSubmissionWorkflow(overviewData.collection.id);

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
