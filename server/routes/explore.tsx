import Promise from 'bluebird';
import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { Community } from 'server/models';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

app.get('/explore', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	const whereQuery = req.query.show === 'all' ? {} : { where: { isFeatured: true } };
	const getActiveCommunities = Community.findAll({
		attributes: [
			'id',
			'subdomain',
			'domain',
			'title',
			'description',
			'heroBackgroundImage',
			'heroLogo',
			'accentColorLight',
			'accentColorDark',
			'headerLogo',
			'headerColorType',
			'createdAt',
			'updatedAt',
		],
		...whereQuery,
	});

	// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
	return Promise.all([getInitialData(req), getActiveCommunities])
		.then(([initialData, activeCommunitiesData]) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Explore"
					initialData={initialData}
					viewData={{ exploreData: { activeCommunities: activeCommunitiesData } }}
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ initialData: any; title: strin... Remove this comment to see the full error message
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: 'Explore · PubPub',
						description: 'Explore the active communities built on PubPub.',
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
