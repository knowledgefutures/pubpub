import React from 'react';
import Signup from 'containers/Signup/Signup';
import Html from '../Html';
import app from '../server';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';

app.get('/signup', (req, res, next)=> {
	return getInitialData(req)
	.then((initialData)=> {
		return renderToNodeStream(res,
			<Html
				chunkName="Signup"
				initialData={initialData}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: `Signup · ${initialData.communityData.title}`,
					description: initialData.communityData.description,
				})}
			>
				<Signup {...initialData} />
			</Html>
		);
	})
	.catch(handleErrors(req, res, next));
});
