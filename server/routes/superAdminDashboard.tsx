import type * as types from 'types';

import React from 'react';

import { Router } from 'express';

import { filtersById as spamFiltersById } from 'client/containers/SuperAdminDashboard/CommunitySpam/filters';
import { filtersById as spamUsersFiltersById } from 'client/containers/SuperAdminDashboard/UserSpam/filters';
import Html from 'server/Html';
import { getLandingPageFeatures } from 'server/landingPageFeature/queries';
import { queryCommunitiesForSpamManagement } from 'server/spamTag/communityDashboard';
import { queryUsersForSpamManagement } from 'server/spamTag/userDashboard';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import {
	getSuperAdminTabUrl,
	isSuperAdminTabKind,
	type SuperAdminTabKind,
	superAdminTabKinds,
} from 'utils/superAdmin';

export const router = Router();

const getTabProps = async (tabKind: SuperAdminTabKind, locationData: types.LocationData) => {
	if (tabKind === 'landingPageFeatures') {
		return { landingPageFeatures: await getLandingPageFeatures({ onlyValidItems: false }) };
	}
	if (tabKind === 'spam') {
		const searchTerm = locationData.query.q ?? null;
		const { query } = spamFiltersById[searchTerm ? 'recent' : 'unreviewed'];
		return {
			searchTerm,
			communities: await queryCommunitiesForSpamManagement({
				limit: 50,
				searchTerm,
				...query!,
			}),
		};
	}
	if (tabKind === 'spamUsers') {
		const searchTerm = locationData.query.q ?? null;
		const filterId = (locationData.query.filter as string) ?? 'all';
		const baseFilter = spamUsersFiltersById[filterId] ?? spamUsersFiltersById.all;
		const sortParam = locationData.query.sort as string | undefined;
		const ordering = sortParam
			? {
					field: sortParam.split(':')[0],
					direction: sortParam.split(':')[1] || 'DESC',
				}
			: baseFilter.query!.ordering;
		const users = await queryUsersForSpamManagement({
			limit: 50,
			searchTerm,
			includeAffiliation: true,
			...baseFilter.query!,
			ordering: ordering as any,
			communitySubdomain: (locationData.query.community as string) || undefined,
			createdAfter: (locationData.query.createdAfter as string) || undefined,
			createdBefore: (locationData.query.createdBefore as string) || undefined,
			activeAfter: (locationData.query.activeAfter as string) || undefined,
			activeBefore: (locationData.query.activeBefore as string) || undefined,
			minActivities: locationData.query.minActivities
				? Number(locationData.query.minActivities)
				: undefined,
			maxActivities: locationData.query.maxActivities
				? Number(locationData.query.maxActivities)
				: undefined,
		});
		return {
			searchTerm,
			users,
		};
	}
	return {};
};

router.get('/superadmin', async (_, res) => {
	const [firstTab] = superAdminTabKinds;
	return res.redirect(getSuperAdminTabUrl(firstTab));
});

router.get('/superadmin/:tabKind', async (req, res, next) => {
	try {
		const { tabKind } = req.params;
		if (!isSuperAdminTabKind(tabKind)) {
			throw new NotFoundError();
		}
		const initialData = await getInitialData(req);
		if (!initialData.loginData.isSuperAdmin) {
			throw new ForbiddenError();
		}
		return renderToNodeStream(
			res,
			<Html
				chunkName="SuperAdminDashboard"
				initialData={initialData}
				viewData={{
					tabKind,
					tabProps: await getTabProps(tabKind, initialData.locationData),
				}}
				headerComponents={generateMetaComponents({
					initialData,
					title: 'SuperAdmin · PubPub',
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
