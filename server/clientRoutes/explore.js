import Promise from 'bluebird';
import React from 'react';
import Explore from 'containers/Explore/Explore';
import Html from '../Html';
import app from '../server';
import { Community, Pub, Discussion, sequelize } from '../models';
import { hostIsValid, renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';

app.get('/explore', (req, res, next)=> {
	if (!hostIsValid(req, 'pubpub')) { return next(); }

	const getActiveCommunities = Community.findAll({
		attributes: [
			'id', 'subdomain', 'domain', 'title', 'description', 'largeHeaderBackground',
			'largeHeaderLogo', 'accentColor', 'accentTextColor', 'createdAt', 'updatedAt'
		],
		where: {
			createdAt: {
				[sequelize.Op.lt]: new Date(new Date().setDate(new Date().getDate()-30))
			}
		}
	});

	return Promise.all([getInitialData(req), getActiveCommunities])
	.then(([initialData, activeCommunitiesData])=> {
		const newInitialData = {
			...initialData,
			exploreData: { activeCommunities: activeCommunitiesData },
		};
		return renderToNodeStream(res,
			<Html
				chunkName="Explore"
				initialData={newInitialData}
				headerComponents={generateMetaComponents({
					initialData: newInitialData,
					title: 'Explore · PubPub',
					description: 'Explore the active communities built on PubPub.',
				})}
			>
				<Explore {...newInitialData} />
			</Html>
		);
	})
	.catch(handleErrors(req, res, next));
});
