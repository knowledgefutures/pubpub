import React from 'react';

import { Router } from 'express';

import { getActiveTemplatesForOrg } from 'server/communityTemplate/queries';
import Html from 'server/Html';
import { getOrgBySlug, getOrgCommunities, isUserOrgMember } from 'server/org/queries';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/community/create', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	const orgSlug = req.query.org as string | undefined;

	return Promise.all([
		getInitialData(req),
		orgSlug ? getOrgBySlug(orgSlug) : Promise.resolve(null),
	])
		.then(async ([initialData, orgData]) => {
			const templates = orgData ? await getActiveTemplatesForOrg(orgData.id) : [];

			// Fetch the org's communities for the clone-from-community picker
			let orgCommunities: {
				id: string;
				title: string;
				subdomain: string;
				avatar?: string;
			}[] = [];
			if (orgData && orgData.communityCloneAccess !== 'off') {
				const userId = initialData.loginData?.id;
				const isSuperAdmin = initialData.loginData?.isSuperAdmin;
				const isMember = userId ? await isUserOrgMember(userId, orgData.id) : false;

				// 'managers' mode: only org members and superadmins can clone
				// 'everyone' mode: anyone can
				const canSeeClone =
					orgData.communityCloneAccess === 'everyone' || isSuperAdmin || isMember;

				if (canSeeClone) {
					const communities = await getOrgCommunities(orgData.id);
					orgCommunities = communities.map((c: any) => ({
						id: c.id,
						title: c.title,
						subdomain: c.subdomain,
						avatar: c.headerLogo || c.heroLogo || null,
					}));
				}
			}

			const title = orgData
				? `Create Community · ${orgData.title}`
				: 'Create New Community · PubPub';
			return renderToNodeStream(
				res,
				<Html
					chunkName="CommunityCreate"
					initialData={initialData}
					viewData={{ orgData, templates, orgCommunities }}
					headerComponents={generateMetaComponents({
						initialData,
						title,
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
