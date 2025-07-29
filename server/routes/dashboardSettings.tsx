import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors, ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPubForRequest } from 'server/utils/queryHelpers';
import { getCommunityDepositTarget } from 'server/depositTarget/queries';
import { InitialData } from 'types';
import { getCommunityArchives } from 'server/community/queries';

const getSettingsData = async (initialData: InitialData, pubSlug?: string, isAdmin?: boolean) => {
	const [depositTarget, pubData, archives] = await Promise.all([
		getCommunityDepositTarget(initialData.communityData.id),
		pubSlug
			? getPubForRequest({
					slug: pubSlug,
					initialData,
					getEdges: 'all',
			  })
			: null,
		isAdmin ? getCommunityArchives(initialData.communityData.id) : null,
	]);
	const baseSettingsData = {
		depositTarget,
		archives,
	};
	if (pubSlug) {
		return {
			...baseSettingsData,
			pubData,
		};
	}
	return baseSettingsData;
};

app.get(
	[
		'/dash/settings',
		'/dash/collection/:collectionSlug/settings',
		'/dash/pub/:pubSlug/settings',
		'/dash/settings/:subMode',
		'/dash/collection/:collectionSlug/settings/:subMode',
		'/dash/pub/:pubSlug/settings/:subMode',
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

			if (!initialData.scopeData.activePermissions.canView) {
				throw new ForbiddenError();
			}

			const settingsData = await getSettingsData(
				initialData,
				req.params.pubSlug,
				initialData.scopeData.activePermissions.canAdmin,
			);

			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardSettings"
					initialData={initialData}
					viewData={{ settingsData, subMode: req.params.subMode }}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Settings · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
