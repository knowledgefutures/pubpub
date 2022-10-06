import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getLayoutPubsByBlock } from 'server/utils/layouts';
import { handleErrors, NotFoundError } from 'server/utils/errors';

app.get('/dash/collection/:collectionSlug/layout', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req, { isDashboard: true });
		const { activeCollection: collection } = initialData.scopeData.elements;

		if (!initialData.scopeData.activePermissions.canView || !collection) {
			throw new NotFoundError();
		}

		return renderToNodeStream(
			res,
			<Html
				chunkName="DashboardCollectionLayout"
				initialData={initialData}
				viewData={{
					layoutPubsByBlock: await getLayoutPubsByBlock({
						blocks: collection.layout && collection.layout.blocks,
						initialData,
						collectionId: collection.id,
					}),
					collection,
				}}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Layout · ${initialData.scopeData.elements.activeTarget.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
