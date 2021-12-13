import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getManyPubs } from 'server/pub/queryMany';
import { InitialData } from 'types';

const getPubs = async (collectionId: string, limit: number, initialData: InitialData) => {
	const { communityData } = initialData;
	const result = await getManyPubs({
		query: {
			limit,
			communityId: communityData.id,
			scopedCollectionId: collectionId,
			submissionStatuses: ['incomplete', 'pending', 'accepted', 'declined'],
		},
	});
	return result.sanitize(initialData);
};

app.get(['/dash/collection/:collectionSlug/submissions'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}

		const initialData = await getInitialData(req, true);
		if (!initialData.featureFlags.submissions) {
			return next();
		}

		const {
			scopeData: {
				activePermissions: { canManage },
			},
		} = initialData;

		if (!canManage) {
			throw new ForbiddenError();
		}

		const { activeCollection } = initialData.scopeData.elements;
		const collectionId = activeCollection!.id;
		const [initialPubs] = await Promise.all([getPubs(collectionId, 200, initialData)]);
		const initiallyLoadedAllPubs = !!initialPubs;
		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardSubmissions"
				initialData={initialData}
				viewData={{ initialPubs, initiallyLoadedAllPubs }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Submissions · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
