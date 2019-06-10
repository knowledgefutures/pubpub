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

const getMode = (path, params) => {
	const { slug, reviewShortId } = params;
	if (path.indexOf(`/pub/${slug}/merge/`) > -1) {
		return 'merge';
	}
	if (path.indexOf(`/pub/${slug}/reviews/new`) > -1) {
		return 'reviewCreate';
	}
	if (path.indexOf(`/pub/${slug}/reviews/${reviewShortId}`) > -1) {
		return 'review';
	}
	if (path.indexOf(`/pub/${slug}/reviews`) > -1) {
		return 'reviews';
	}
	if (path.indexOf(`/pub/${slug}/manage`) > -1) {
		return 'manage';
	}
	if (path.indexOf(`/pub/${slug}/branch/new`) > -1) {
		return 'branchCreate';
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

		const mode = getMode(req.path, req.params);
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
				const primaryCollection = pubData.collectionPubs.reduce((prev, curr) => {
					if (curr.isPrimary && curr.collection.kind !== 'issue') {
						return curr;
					}
					return prev;
				}, {});
				const contextTitle = primaryCollection.title || initialData.communityData.title;
				/* We calculate titleWithContext in generateMetaComponents. Since we will use */
				/* titleWithContext in other locations (e.g. search), we should eventually */
				/* write a helper function that generates these parameters. */
				return renderToNodeStream(
					res,
					<Html
						chunkName="Pub"
						initialData={newInitialData}
						headerComponents={generateMetaComponents({
							initialData: initialData,
							title: pubData.title,
							contextTitle: contextTitle,
							description: pubData.description,
							image: pubData.avatar,
							attributions: pubData.attributions,
							publishedAt: pubData.firstPublishedAt,
							doi: pubData.doi,
							// unlisted: isUnlistedDraft,
						})}
					>
						<Pub {...newInitialData} />
					</Html>,
				);
			})
			.catch(handleErrors(req, res, next));
	},
);
