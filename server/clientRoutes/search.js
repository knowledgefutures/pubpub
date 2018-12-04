import React from 'react';
import algoliasearch from 'algoliasearch';
import Search from 'containers/Search/Search';
import Html from '../Html';
import app from '../server';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';

const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY);
const searchId = process.env.ALGOLIA_ID;
const searchKey = process.env.ALGOLIA_SEARCH_KEY;


app.get('/search', (req, res, next)=> {
	return getInitialData(req)
	.then((initialData)=> {
		const pubSearchParams = {
			filters: 'versionIsPublic:true',
		};
		const pageSearchParams = {
			filters: 'isPublic:true',
		};
		const newInitialData = {
			...initialData,
			searchData: {
				searchId: searchId,
				pubsSearchKey: client.generateSecuredApiKey(searchKey, pubSearchParams),
				pagesSearchKey: client.generateSecuredApiKey(searchKey, pageSearchParams),
			},
		};
		return renderToNodeStream(res,
			<Html
				chunkName="Search"
				initialData={newInitialData}
				headerComponents={generateMetaComponents({
					initialData: newInitialData,
					title: `Search · ${initialData.communityData.title}`,
					description: `Search for pubs in ${initialData.communityData.title}`,
				})}
			>
				<Search {...newInitialData} />
			</Html>
		);
	})
	.catch(handleErrors(req, res, next));
});
