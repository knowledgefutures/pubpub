import React from 'react';
import Promise from 'bluebird';
import { Pub } from 'containers';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utils';
import { getFirebaseToken } from '../utils/firebaseAdmin';
import { findPub } from '../utils/pubQueries';

const getMode = (path, slug) => {
	if (path.indexOf(`/pub/${slug}/submission`) > -1) {
		return 'submission';
	}
	if (path.indexOf(`/pub/${slug}/manage`) > -1) {
		return 'manage';
	}
	return 'document';
};

/*
	What does the header do in Settings mode?
	How do we get back to the 'doc'
	How do we navigate when in a submission?

*/
app.get(
	[
		'/pub/:slug',
		'/pub/:slug/branch/:branchShortId',
		'/pub/:slug/branch/:branchShortId/:versionNumber',
		'/pub/:slug/submission',
		'/pub/:slug/manage/',
		'/pub/:slug/manage/:manageMode',
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
						chunkName="Pub"
						initialData={newInitialData}
						headerComponents={generateMetaComponents({
							initialData: initialData,
						})}
					>
						<Pub {...newInitialData} />
					</Html>,
				);
			})
			.catch(handleErrors(req, res, next));
	},
);
