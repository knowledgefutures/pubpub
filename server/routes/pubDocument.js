import React from 'react';
import { getPubPageContextTitle } from 'shared/utils/pubPageTitle';
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
import {
	getPub,
	sanitizePub,
	enrichPubFirebaseDoc,
	enrichPubFirebaseToken,
	enrichPubCitations,
} from '../utils/queryHelpers';

app.get(
	[
		'/pub/:pubSlug/draft',
		'/pub/:pubSlug/draft/:historyNumber',
		'/pub/:pubSlug/release/:historyNumber',
	],
	async (req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		try {
			const initialData = await getInitialData(req);
			const { canView, canViewDraft } = initialData.scopeData.activePermissions;
			const isRelease = req.path.indexOf(`/pub/${req.params.pubSlug}/release`) > -1;
			const branchType = isRelease ? 'public' : 'draft';
			const validHistoryNumber = req.params.historyNumber
				? Number(req.params.historyNumber) > 0
				: true;
			if ((!isRelease && !canView && !canViewDraft) || !validHistoryNumber) {
				throw new Error('Pub Not Found');
			}

			let pubData = await getPub(req.params.pubSlug, initialData.communityData.id);
			pubData = sanitizePub(pubData, initialData, req.params.historyNumber, isRelease);
			if (!pubData) {
				throw new Error('Pub Not Found');
			}
			/* versionNumber is 0-indexed in firebase. historyNumber is 1-indexed for UI purposes. */
			pubData = await enrichPubFirebaseDoc(pubData, req.params.historyNumber - 1, branchType);
			pubData = await enrichPubFirebaseToken(pubData, initialData);
			pubData = await enrichPubCitations(pubData, initialData);

			/* We calculate titleWithContext in generateMetaComponents. Since we will use */
			/* titleWithContext in other locations (e.g. search), we should eventually */
			/* write a helper function that generates these parameters. */
			return renderToNodeStream(
				res,
				<Html
					chunkName="Pub"
					initialData={initialData}
					viewData={{ pubData: pubData }}
					headerComponents={generateMetaComponents({
						initialData: initialData,
						title: pubData.title,
						contextTitle: getPubPageContextTitle(pubData, initialData.communityData),
						description: pubData.description,
						image: pubData.avatar,
						attributions: pubData.attributions,
						publishedAt: pubData.originallyPublishedAt || pubData.firstPublishedAt,
						doi: pubData.doi,
						collection: chooseCollectionForPub(pubData, initialData.locationData),
						download: getPDFDownload(pubData),
						textAbstract: pubData.initialDoc ? getTextAbstract(pubData.initialDoc) : '',
						notes: getGoogleScholarNotes(pubData.citations.concat(pubData.footnotes)),
						unlisted: !isRelease,
					})}
				/>,
			);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);
