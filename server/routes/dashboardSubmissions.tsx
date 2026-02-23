import type * as types from 'types';

import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { SubmissionWorkflow } from 'server/models';
import { getManyPubs } from 'server/pub/queryMany';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getDashUrl } from 'utils/dashboard';

export const router = Router();

const getInitialPubs = async (
	collectionId: string,
	limit: number,
	initialData: types.InitialData,
) => {
	const { communityData } = initialData;
	const result = await getManyPubs({
		options: { getSubmissions: true },
		query: {
			limit,
			communityId: communityData.id,
			scopedCollectionId: collectionId,
			submissionStatuses: ['received'],
		},
	});
	const initialPubs = await result.sanitize(initialData);
	const initiallyLoadedAllPubs = initialPubs.length < limit;
	return { initialPubs, initiallyLoadedAllPubs };
};

const getSubmissionWorkflow = async (collectionId: string) => {
	const workflow = await SubmissionWorkflow.findOne({ where: { collectionId } });
	if (workflow) {
		return workflow.toJSON();
	}
	return null;
};

router.get(
	[
		'/dash/collection/:collectionSlug/submissions',
		'/dash/collection/:collectionSlug/submissions/:subMode',
	],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}

			const initialData = await getInitialData(req, { isDashboard: true });
			if (!initialData.scopeData.elements.activeTarget) {
				throw new NotFoundError();
			}

			if (!initialData.featureFlags.submissions) {
				return next();
			}

			const {
				scopeData: {
					activePermissions: { canManage },
					elements: { activeCollection },
				},
			} = initialData;

			if (!canManage) {
				throw new ForbiddenError();
			}

			const { subMode } = req.params;
			const { id: collectionId, slug: collectionSlug } = activeCollection!;

			const [{ initialPubs, initiallyLoadedAllPubs }, initialSubmissionWorkflow] =
				await Promise.all([
					getInitialPubs(collectionId, 200, initialData),
					getSubmissionWorkflow(collectionId),
				]);

			if (subMode === 'workflow') {
				return renderToNodeStream(
					res,
					<Html
						chunkName="DashboardSubmissionWorkflow"
						initialData={initialData}
						viewData={{ initialSubmissionWorkflow }}
						headerComponents={generateMetaComponents({
							initialData,
							title: `Submission Workflow · ${initialData.scopeData.elements.activeTarget.title ?? initialData.communityData.title}`,
							unlisted: true,
						})}
					/>,
				);
			}

			if (initialSubmissionWorkflow) {
				return renderToNodeStream(
					res,
					<Html
						chunkName="DashboardSubmissions"
						initialData={initialData}
						viewData={{
							initialPubs,
							initiallyLoadedAllPubs,
							initialSubmissionWorkflow,
						}}
						headerComponents={generateMetaComponents({
							initialData,
							title: `Submissions · ${initialData.scopeData.elements.activeTarget.title ?? initialData.communityData.title}`,
							unlisted: true,
						})}
					/>,
				);
			}

			return res.redirect(
				getDashUrl({ mode: 'submissions', subMode: 'workflow', collectionSlug }),
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
