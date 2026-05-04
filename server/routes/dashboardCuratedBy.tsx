import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { getHubsForCommunity } from 'server/hub/queries';
import { getHubsForPub } from 'server/hubPub/queries';
import { HubCommunity, HubOptOut } from 'server/models';
import { handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/dash/curatedby', async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		const initialData = await getInitialData(req, { isDashboard: true });
		if (!initialData.scopeData.elements.activeTarget) {
			throw new NotFoundError();
		}
		if (!initialData.scopeData.activePermissions.canManage) {
			throw new NotFoundError();
		}

		const { activePub } = initialData.scopeData.elements;
		const communityId = initialData.communityData.id;

		let curatingHubs;
		let scopeType: 'community' | 'pub';

		if (activePub) {
			// Pub-scope: load hubs curating this specific pub
			scopeType = 'pub';
			curatingHubs = await getHubsForPub(activePub.id);
		} else {
			// Community-scope: load hubs curating this community
			scopeType = 'community';
			const [orgs, optOuts, hubCommunities] = await Promise.all([
				getHubsForCommunity(communityId),
				HubOptOut.findAll({
					where: { communityId },
					attributes: ['hubId'],
				}),
				HubCommunity.findAll({
					where: { communityId },
					attributes: ['hubId', 'dataAccess'],
				}),
			]);
			const rejectedOrgIds = new Set(optOuts.map((o) => (o as any).hubId));
			const dataAccessMap = new Map(
				hubCommunities.map((hc) => [(hc as any).hubId, (hc as any).dataAccess]),
			);
			curatingHubs = orgs.map((org: any) => ({
				...org,
				rejected: rejectedOrgIds.has(org.id),
				dataAccess: dataAccessMap.get(org.id) || 'none',
			}));
		}

		const scopeTitle = activePub ? activePub.title : initialData.communityData.title;

		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardCuratedBy"
				initialData={initialData}
				viewData={{ curatingHubs, scopeType }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Curated By · ${scopeTitle}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
