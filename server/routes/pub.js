import React from 'react';
import uuidValidate from 'uuid-validate';
import { getPubPageContextTitle } from 'shared/utils/pubPageTitle';
import { getPubPublishedDate } from 'shared/pub/pubDates';
import { getPDFDownload, getTextAbstract, getGoogleScholarNotes } from 'shared/pub/metadata';
import { chooseCollectionForPub } from '../../client/utils/collections';
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
	const { pubSlug, reviewShortId } = params;
	if (path.indexOf(`/pub/${pubSlug}/draft`) > -1) {
		return 'draft-redirect';
	}
	if (path.indexOf(`/pub/${pubSlug}/merge/`) > -1) {
		return 'merge';
	}
	if (path.indexOf(`/pub/${pubSlug}/reviews/new`) > -1) {
		return 'reviewCreate';
	}
	if (path.indexOf(`/pub/${pubSlug}/reviews/${reviewShortId}`) > -1) {
		return 'review';
	}
	if (path.indexOf(`/pub/${pubSlug}/reviews`) > -1) {
		return 'reviews';
	}
	if (path.indexOf(`/pub/${pubSlug}/manage`) > -1) {
		return 'manage';
	}
	if (path.indexOf(`/pub/${pubSlug}/branch/new`) > -1) {
		return 'branchCreate';
	}
	return 'document';
};

app.get(
	[
		'/pub/:pubSlug',
		'/pub/:pubSlug/draft',
		'/pub/:pubSlug/branch/new',
		'/pub/:pubSlug/branch/:branchShortId',
		'/pub/:pubSlug/branch/:branchShortId/:versionNumber',
		'/pub/:pubSlug/merge/:fromBranchShortId/:toBranchShortId',
		'/pub/:pubSlug/reviews/new/:fromBranchShortId/',
		'/pub/:pubSlug/reviews/new/:fromBranchShortId/:toBranchShortId',
		'/pub/:pubSlug/reviews',
		'/pub/:pubSlug/reviews/:reviewShortId',
		'/pub/:pubSlug/manage/',
		'/pub/:pubSlug/manage/:manageMode',
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
					return res.redirect(
						`/pub/${req.params.pubSlug}/branch/${shortId}/${historyKey}`,
					);
				}
			}

			const mode = getMode(req.path, req.params);
			if (mode === 'draft-redirect') {
				return res.redirect(`/pub/${req.params.pubSlug}`);
			}

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
						return res.redirect(`/pub/${req.params.pubSlug}/branch/${shortId}/`);
					}
					throw new Error('Pub Not Found');
				}
				throw e;
			}

			if (
				mode === 'document' &&
				pubData.activeBranch.title === 'public' &&
				!pubData.activeBranch.firstKeyAt
			) {
				const draftBranch = pubData.branches.find((br) => {
					return br.title === 'draft';
				});
				if (!draftBranch || !draftBranch.canView) {
					throw new Error('Pub Not Found');
				}
				return res.redirect(`/pub/${req.params.pubSlug}/branch/${draftBranch.shortId}`);
			}

			const firebaseToken = await getFirebaseToken(initialData.loginData.id || 'anon', {
				branchId: `branch-${pubData.activeBranch.id}`,
				canEditBranch: pubData.activeBranch.canEdit,
				canViewBranch: pubData.activeBranch.canView,
				canDiscussBranch: pubData.activeBranch.canDiscuss,
				canManage: pubData.canManage,
				userId: initialData.loginData.id,
			});

			const viewData = {
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
					initialData={initialData}
					viewData={viewData}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: pubData.title,
						contextTitle: getPubPageContextTitle(pubData, initialData.communityData),
						description: pubData.description,
						image: pubData.avatar,
						attributions: pubData.attributions,
						publishedAt: getPubPublishedDate(
							pubData,
							pubData.branches.find((br) => br.title === 'public'),
						),
						doi: pubData.doi,
						collection: chooseCollectionForPub(pubData, initialData.locationData),
						download: getPDFDownload(pubData),
						textAbstract: pubData.initialDoc ? getTextAbstract(pubData.initialDoc) : '',
						notes: getGoogleScholarNotes(pubData.citations.concat(pubData.footnotes)),
						// unlisted: isUnlistedDraft,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
