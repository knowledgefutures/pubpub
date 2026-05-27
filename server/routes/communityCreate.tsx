import React from 'react';

import { Router } from 'express';

import { getActiveTemplatesForHub } from 'server/communityTemplate/queries';
import Html from 'server/Html';
import {
	getHubBySlug,
	getHubCommunities,
	getHubWithCommunities,
	isUserHubManager,
} from 'server/hub/queries';
import { fetchUserOrgs } from 'server/kf/auth';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/community/create', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	const hubSlug = req.query.hub as string | undefined;

	return Promise.all([
		getInitialData(req),
		hubSlug ? getHubBySlug(hubSlug) : Promise.resolve(null),
		req.user?.id ? fetchUserOrgs(req.user.id) : Promise.resolve([]),
	])
		.then(async ([initialData, hubData, kfOrgs]) => {
			const templates = hubData ? await getActiveTemplatesForHub(hubData.id) : [];

			// Fetch hub communities for the clone-from-community picker
			let hubCommunities: {
				id: string;
				title: string;
				subdomain: string;
				avatar?: string;
			}[] = [];
			if (hubData && hubData.communityCloneAccess !== 'off') {
				const userId = initialData.loginData?.id;
				const isSuperAdmin = initialData.loginData?.isSuperAdmin;
				const isManager = userId ? await isUserHubManager(userId, hubData.id) : false;

				// 'managers' mode: only load communities for managers/superadmins
				// 'everyone' mode: load for all users
				const canSeeClone =
					hubData.communityCloneAccess === 'everyone' || isSuperAdmin || isManager;

				if (canSeeClone) {
					if (isSuperAdmin || isManager) {
						// Managers/superadmins see all hub communities
						const allCommunities = await getHubCommunities(hubData.id);
						hubCommunities = allCommunities.map((c: any) => ({
							id: c.id,
							title: c.title,
							subdomain: c.subdomain,
							avatar: c.headerLogo || c.heroLogo || null,
						}));
					} else {
						// Regular users see only landing-page-visible communities
						const hubWithCommunities = await getHubWithCommunities(hubSlug!);
						if (hubWithCommunities?.communities) {
							hubCommunities = hubWithCommunities.communities.map((c: any) => ({
								id: c.id,
								title: c.title,
								subdomain: c.subdomain,
								avatar: c.headerLogo || c.heroLogo || null,
							}));
						}
					}
				}
			}

			const title = hubData
				? `Create Community · ${hubData.title}`
				: 'Create New Community · PubPub';
			return renderToNodeStream(
				res,
				<Html
					chunkName="CommunityCreate"
					initialData={initialData}
					viewData={{ hubData, templates, hubCommunities, kfOrgs }}
					headerComponents={generateMetaComponents({
						initialData,
						title,
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
