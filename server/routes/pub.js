import React from 'react';
import uuidValidate from 'uuid-validate';
import { Pub } from 'containers';

import { getPubPageContextTitle } from 'shared/utils/pubPageTitle';
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
import { findPub, lookupPubVersion } from '../utils/pubQueries';
import { PubBranchNotVisibleError } from '../utils/formatPub';

const getMode = (path, params) => {
	const { slug, reviewShortId } = params;
	if (path.indexOf(`/pub/${slug}/draft`) > -1) {
		return 'draft-redirect';
	}
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
		'/pub/:slug/draft',
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
	async (req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		try {
			if (req.query.version) {
				if (!uuidValidate(req.query.version)) {
					throw new Error('Pub Not Found');
				}
				const versionLookup = await lookupPubVersion(req.query.version);
				if (versionLookup) {
					const { historyKey, shortId } = versionLookup;
					return res.redirect(`/pub/${req.params.slug}/branch/${shortId}/${historyKey}`);
				}
			}

			const mode = getMode(req.path, req.params);
			const initialData = await getInitialData(req);
			let pubData;

			try {
				pubData = await findPub(req, initialData, mode);
			} catch (e) {
				if (e instanceof PubBranchNotVisibleError) {
					const redirectBranch =
						req.params.branchShortId === undefined && e.availableBranches[0];
					if (redirectBranch) {
						const { shortId } = redirectBranch;
						return res.redirect(`/pub/${req.params.slug}/branch/${shortId}/`);
					}
					throw new Error('Pub Not Found');
				}
				throw e;
			}
        
			if (mode === 'draft-redirect') {
				return res.redirect(`/pub/${req.params.slug}`);
			}

			const firebaseToken = await getFirebaseToken(initialData.loginData.id || 'anon', {
				branchId: `branch-${pubData.activeBranch.id}`,
				canEditBranch: pubData.activeBranch.canEdit,
				canViewBranch: pubData.activeBranch.canView,
				canDiscussBranch: pubData.activeBranch.canDiscuss,
				canManage: pubData.canManage,
				userId: initialData.loginData.id,
			});

			const newInitialData = {
				...initialData,
				pubData: {
					...pubData,
					firebaseToken: firebaseToken,
					mode: mode,
				},
			};
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
						contextTitle: getPubPageContextTitle(pubData, initialData.communityData),
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
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
