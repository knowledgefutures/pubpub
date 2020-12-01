import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPubsForLayout } from 'server/utils/queryHelpers/layout';
import { handleErrors, NotFoundError } from 'server/utils/errors';

app.get('/dash/collection/:collectionSlug/layout', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req, true);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'elements' does not exist on type '{ elem... Remove this comment to see the full error message
		const { activeCollection: collection } = initialData.scopeData.elements;

		if (!initialData.scopeData.activePermissions.canView) {
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
			throw new NotFoundError();
		}

		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardCollectionLayout"
				initialData={initialData}
				viewData={{
					pubs: await getPubsForLayout({
						blocks: collection.layout && collection.layout.blocks,
						forLayoutEditor: true,
						initialData: initialData,
						collectionId: collection.id,
					}),
					collection: collection,
				}}
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
				headerComponents={generateMetaComponents({
					initialData: initialData,
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'elements' does not exist on type '{ elem... Remove this comment to see the full error message
					title: `Layout · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
