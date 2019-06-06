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
	if (path.indexOf(`/pub/${slug}/merge/`) > -1) {
		return 'merge';
	}
	if (path.indexOf(`/pub/${slug}/reviews/new`) > -1) {
		return 'new review';
	}
	if (path.indexOf(`/pub/${slug}/reviews`) > -1) {
		return 'reviews';
	}
	if (path.indexOf(`/pub/${slug}/manage`) > -1) {
		return 'manage';
	}
	if (path.indexOf(`/pub/${slug}/branch/new`) > -1) {
		return 'new branch';
	}
	return 'document';
};

app.get(
	[
		'/pub/:slug',
		'/pub/:slug/branch/new',
		'/pub/:slug/branch/:branchShortId',
		'/pub/:slug/branch/:branchShortId/:versionNumber',
		'/pub/:slug/merge/:fromBranchShortId/:toBranchShortId',
		'/pub/:slug/reviews/new/:fromBranchShortId/',
		'/pub/:slug/reviews/new/:fromBranchShortId/:toBranchShortId',
		'/pub/:slug/reviews',
		'/pub/:slug/reviews/:reviewShortId',
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
					getFirebaseToken(initialData.loginData.id || 'anon', {}),
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
