import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { getOrgDataDashboard } from 'server/org/dataQueries';
import { getOrgBySlug, isUserOrgMember } from 'server/org/queries';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/org/:slug/data', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	try {
		const { slug } = req.params;
		const [initialData, org] = await Promise.all([getInitialData(req), getOrgBySlug(slug)]);

		if (!org) {
			throw new NotFoundError();
		}

		const isSuperAdmin = initialData.loginData.isSuperAdmin;
		const isManager = initialData.loginData.id
			? await isUserOrgMember(initialData.loginData.id, org.id)
			: false;

		// Inactive orgs: only superadmins can see the dashboard
		if (!org.isActive && !isSuperAdmin) {
			throw new NotFoundError();
		}

		// During private rollout, all org dashboards require superadmin or manager access
		if (!isSuperAdmin && !isManager) {
			throw new ForbiddenError();
		}

		const orgData = await getOrgDataDashboard(slug, {
			userId: initialData.loginData.id,
		});
		if (!orgData) {
			throw new NotFoundError();
		}

		return renderToNodeStream(
			res,
			<Html
				chunkName="OrgData"
				initialData={initialData}
				viewData={{ orgData }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `${orgData.org.title} — Data · PubPub`,
					description: `Data dashboard for ${orgData.org.title} on PubPub.`,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
