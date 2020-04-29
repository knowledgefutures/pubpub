import React from 'react';
import { Legal } from 'containers';
import Html from '../Html';
import app from '../server';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utils';

app.get('/privacy', (_, res) => res.redirect('/legal/privacy'));
app.get('/privacy/policy', (_, res) => res.redirect('/legal/privacy'));
app.get('/privacy/settings', (_, res) => res.redirect('/legal/settings'));
app.get('/tos', (_, res) => res.redirect('/legal/terms'));
app.get('/legal', (_, res) => res.redirect('/legal/terms'));

app.get('/legal/:tab', (req, res, next) => {
	return getInitialData(req)
		.then((initialData) => {
			return renderToNodeStream(
				res,
				<Html
					chunkName="Legal"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: `Legal · ${initialData.communityData.title}`,
						description: initialData.communityData.description,
					})}
				>
					<Legal {...initialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
