import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getMembers } from 'server/utils/queryHelpers';

app.get(
	['/dash/members', '/dash/collection/:collectionSlug/members', '/dash/pub/:pubSlug/members'],
	async (req, res, next) => {
		try {
			if (!hostIsValid(req, 'community')) {
				return next();
			}
			const initialData = await getInitialData(req, true);
			const membersData = await getMembers(initialData);

			if (!initialData.scopeData.activePermissions.canView) {
				// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
				throw new NotFoundError();
			}

			return renderToNodeStream(
				res,
				<Html
					chunkName="DashboardMembers"
					initialData={initialData}
					viewData={{ membersData: membersData }}
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: { communityData: ... Remove this comment to see the full error message
					headerComponents={generateMetaComponents({
						initialData: initialData,
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'elements' does not exist on type '{ elem... Remove this comment to see the full error message
						title: `Members · ${initialData.scopeData.elements.activeTarget.title}`,
						unlisted: true,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
