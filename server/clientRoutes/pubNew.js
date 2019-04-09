import React from 'react';
import Promise from 'bluebird';
import PubNew from 'containers/PubNew/PubNew';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utilities';
import { getFirebaseToken } from '../utilities/firebaseAdmin';
import { findPub } from '../utilities/pubQueries';

const getMode = (path, slug) => {
	if (path.indexOf(`/pubnew/${slug}/submission`) > -1) {
		return 'submission';
	}
	if (path.indexOf(`/pubnew/${slug}/settings`) > -1) {
		return 'settings';
	}
	return 'document';
};

app.get(
	[
		'/pubnew/:slug',
		'/pubnew/:slug/branch/:branchShortId',
		'/pubnew/:slug/branch/:branchShortId/:versionNumber',
		'/pubnew/:slug/submission',
		'/pubnew/:slug/settings/',
		'/pubnew/:slug/settings/:settingsMode',
	],
	(req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}

		const mode = getMode(req.path, req.params.slug);
		return getInitialData(req)
			.then((initialData) => {
				return Promise.all([
					initialData,
					findPub(req, initialData, mode),
					getFirebaseToken(initialData.loginData.id, {}),
				]);
			})
			.then(([initialData, pubData, firebaseToken]) => {
				const newInitialData = {
					...initialData,
					pubData: {
						...pubData,
						firebaseToken: firebaseToken,
						mode: mode,
					},
				};
				return renderToNodeStream(
					res,
					<Html
						chunkName="PubNew"
						initialData={newInitialData}
						headerComponents={generateMetaComponents({
							initialData: initialData,
						})}
					>
						<PubNew {...newInitialData} />
					</Html>,
				);
			})
			.catch(handleErrors(req, res, next));
	},
);
