import React from 'react';

import Html from 'server/Html';
import { getManyPubs } from 'server/pub/queryMany';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { InitialData } from 'types';

const getPubsWithReviews = async (initialData: InitialData) => {
	const {
		scopeData: {
			elements: { activePub, activeCollection, activeCommunity },
		},
	} = initialData;
	const pubs = await getManyPubs({
		query: {
			hasReviews: true,
			communityId: activeCommunity.id,
			...(activeCollection && { scopedCollectionId: activeCollection.id }),
			...(activePub && { withinPubIds: [activePub.id] }),
		},
		options: {
			getReviews: true,
		},
	});
	return pubs.sanitize(initialData);
};

app.get(
	['/dash/reviews', '/dash/collection/:collectionSlug/reviews', '/dash/pub/:pubSlug/reviews'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, { isDashboard: true });
			const pubsWithReviews = await getPubsWithReviews(initialData);
			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardReviews"
					initialData={initialData}
					viewData={{ pubsWithReviews }}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Reviews · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
