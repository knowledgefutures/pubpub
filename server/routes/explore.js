import Promise from 'bluebird';
import React from 'react';
import Html from '../Html';
import app from '../server';
import { Community } from '../models';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utils';

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

	return Promise.all([getInitialData(req), getActiveCommunities])
		.then(([initialData, activeCommunitiesData]) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Explore"
					initialData={initialData}
					viewData={{ exploreData: { activeCommunities: activeCommunitiesData } }}
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
