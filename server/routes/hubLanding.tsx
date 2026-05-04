import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { getHubWithCommunities, isUserHubManager } from 'server/hub/queries';
import { getLandingPagePubs } from 'server/hubPub/queries';
import { User } from 'server/models';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/hub/:slug', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	try {
		const [initialData, hubData] = await Promise.all([
			getInitialData(req),
			getHubWithCommunities(req.params.slug),
		]);

		if (!hubData) {
			throw new NotFoundError();
		}

		// Fetch featured pubs in parallel (safe even if hub has none)
		const featuredPubs = await getLandingPagePubs(hubData.id);
		const hubDataWithPubs = { ...hubData, featuredPubs };

		const isSuperAdmin = initialData.loginData.isSuperAdmin;
		const isManager = initialData.loginData.id
			? await isUserHubManager(initialData.loginData.id, hubData.id)
			: false;

		// Inactive orgs: only superadmins can view
		if (!hubData.isActive && !isSuperAdmin) {
			throw new NotFoundError();
		}

		// During private rollout, all hub pages require superadmin or manager access
		if (!isSuperAdmin && !isManager) {
			throw new NotFoundError();
		}

		// Determine if the logged-in user can create a community via this hub
		let canCreateCommunity = false;
		if (hubData.communityCreationEnabled) {
			if (isSuperAdmin) {
				canCreateCommunity = true;
			} else if (initialData.loginData.id) {
				const user = await User.findByPk(initialData.loginData.id, {
					attributes: ['email'],
				});
				if (user?.email && hubData.domains && hubData.domains.length > 0) {
					const emailDomain = user.email.split('@')[1]?.toLowerCase();
					if (emailDomain) {
						canCreateCommunity = hubData.domains.some((d: string) => {
							const pattern = d.toLowerCase();
							return emailDomain === pattern || emailDomain.endsWith(`.${pattern}`);
						});
					}
				}
			}
		}

		return renderToNodeStream(
			res,
			<Html
				chunkName="HubLanding"
				initialData={initialData}
				viewData={{ hubData: hubDataWithPubs, canCreateCommunity }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `${hubData.title} · PubPub`,
					description:
						hubData.description || `Communities hosted by ${hubData.title} on PubPub`,
					image: hubData.heroImage || hubData.avatar || undefined,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
