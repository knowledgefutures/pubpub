import React from 'react';
import algoliasearch from 'algoliasearch';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY);
const searchId = process.env.ALGOLIA_ID;
const searchKey = process.env.ALGOLIA_SEARCH_KEY;

app.get('/search', async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		const communityFilter = initialData.locationData.isBasePubPub
			? ''
			: `communityId:${initialData.communityData.id} AND `;
		const pubUserFilterString = initialData.loginData.id
			? ` OR branchAccessIds:${initialData.loginData.id}`
			: '';
		const pubSearchParams = {
			filters: `${communityFilter}(branchIsPublic:true${pubUserFilterString})`,
		};

		const pageUserFilterString = initialData.loginData.id
			? ` OR pageAccessIds:${initialData.loginData.id}`
			: '';
		const pageSearchParams = {
			filters: `${communityFilter}(isPublic:true${pageUserFilterString})`,
		};
		const searchData = {
			searchId: searchId,
			pubsSearchKey: client.generateSecuredApiKey(searchKey, pubSearchParams),
			pagesSearchKey: client.generateSecuredApiKey(searchKey, pageSearchParams),
		};

		return renderToNodeStream(
			res,
			<Html
				chunkName="Search"
				initialData={initialData}
				viewData={{ searchData: searchData }}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: `Search · ${initialData.communityData.title}`,
					description: `Search for pubs in ${initialData.communityData.title}`,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
