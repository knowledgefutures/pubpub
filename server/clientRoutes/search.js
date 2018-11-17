import Promise from 'bluebird';
import React from 'react';
import Search from 'containers/Search/Search';
import Html from '../Html';
import app from '../server';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';
import { getPubSearch } from '../queryHelpers';

app.get('/search', (req, res, next)=> {
	return getInitialData(req)
	.then((initialData)=> {
		return Promise.all([initialData, getPubSearch(req.query, initialData)]);
	})
	.then(([initialData, searchData])=> {
		const newInitialData = {
			...initialData,
			searchData: searchData,
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
