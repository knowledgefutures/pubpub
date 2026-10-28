import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { User } from 'server/models';
import { getOrgWithCommunities, isUserOrgMember } from 'server/org/queries';
import { getLandingPagePubs } from 'server/orgFeaturedPub/queries';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/org/:slug', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	try {
		const [initialData, orgData] = await Promise.all([
			getInitialData(req),
			getOrgWithCommunities(req.params.slug),
		]);

		if (!orgData) {
			throw new NotFoundError();
		}

		// Fetch featured pubs in parallel (safe even if org has none)
		const featuredPubs = await getLandingPagePubs(orgData.id);
		const orgDataWithPubs = { ...orgData, featuredPubs };

		const isSuperAdmin = initialData.loginData.isSuperAdmin;
		const isManager = initialData.loginData.id
			? await isUserOrgMember(initialData.loginData.id, orgData.id)
			: false;

		// Inactive orgs: only superadmins can view
		if (!orgData.isActive && !isSuperAdmin) {
			throw new NotFoundError();
		}

		// During private rollout, all org pages require superadmin or manager access
		if (!isSuperAdmin && !isManager) {
			throw new NotFoundError();
		}

		// Determine if the logged-in user can create a community via this org
		let canCreateCommunity = false;
		if (orgData.communityCreationEnabled) {
			if (isSuperAdmin) {
				canCreateCommunity = true;
			} else if (initialData.loginData.id) {
				const user = await User.findByPk(initialData.loginData.id, {
					attributes: ['email'],
				});
				if (user?.email && orgData.domains && orgData.domains.length > 0) {
					const emailDomain = user.email.split('@')[1]?.toLowerCase();
					if (emailDomain) {
						canCreateCommunity = orgData.domains.some((d: string) => {
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
				chunkName="OrgLanding"
				initialData={initialData}
				viewData={{ orgData: orgDataWithPubs, canCreateCommunity }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `${orgData.title} · PubPub`,
					description:
						orgData.description || `Communities hosted by ${orgData.title} on PubPub`,
					image: orgData.heroImage || orgData.avatar || undefined,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
