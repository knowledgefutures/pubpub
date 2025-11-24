import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getLayoutPubsByBlock } from 'server/utils/layouts';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/dash/collection/:collectionSlug/layout', async (req, res, next) => {
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
						allowDuplicatePubs: collection.layoutAllowsDuplicatePubs,
						blocks: collection.layout && collection.layout.blocks,
						initialData,
						collectionId: collection.id,
					}),
					collection,
				}}
				headerComponents={generateMetaComponents({
					initialData,
					title: `Layout · ${collection.title}`,
					unlisted: true,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
