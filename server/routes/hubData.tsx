import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { getHubDataDashboard } from 'server/hub/dataQueries';
import { getHubBySlug, isUserHubManager } from 'server/hub/queries';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/hub/:slug/data', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	try {
		const { slug } = req.params;
		const [initialData, org] = await Promise.all([getInitialData(req), getHubBySlug(slug)]);

		if (!org) {
			throw new NotFoundError();
		}

		const isSuperAdmin = initialData.loginData.isSuperAdmin;
		const isManager = initialData.loginData.id
			? await isUserHubManager(initialData.loginData.id, org.id)
			: false;

		// Inactive orgs: only superadmins can see the dashboard
		if (!org.isActive && !isSuperAdmin) {
			throw new NotFoundError();
		}

		// During private rollout, all hub dashboards require superadmin or manager access
		if (!isSuperAdmin && !isManager) {
			throw new ForbiddenError();
		}

		const orgData = await getHubDataDashboard(slug, {
			userId: initialData.loginData.id,
		});
		if (!orgData) {
			throw new NotFoundError();
		}

		return renderToNodeStream(
			res,
			<Html
				chunkName="HubData"
				initialData={initialData}
				viewData={{ orgData }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `${orgData.hub.title} — Data · PubPub`,
					description: `Data dashboard for ${orgData.hub.title} on PubPub.`,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
