import React from 'react';

import { getPubPageContextTitle } from 'utils/pubPageTitle';
import { getPdfDownloadUrl, getTextAbstract, getGoogleScholarNotes } from 'utils/pub/metadata';
import { chooseCollectionForPub } from 'client/utils/collections';
import Html from 'server/Html';
import app from 'server/server';
import { handleErrors, NotFoundError, ForbiddenError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import {
	getPub,
	getMembers,
	sanitizePub,
	enrichPubFirebaseDoc,
	enrichPubFirebaseToken,
	enrichPubCitations,
	enrichAndSanitizePubEdges,
} from 'server/utils/queryHelpers';

const renderPubDocument = (res, pubData, initialData) => {
	return renderToNodeStream(
		res,
		<Html
			chunkName="Pub"
			initialData={initialData}
			viewData={{ pubData: pubData }}
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ attributions: any; collection:... Remove this comment to see the full error message
			headerComponents={generateMetaComponents({
				attributions: pubData.attributions,
				collection: chooseCollectionForPub(pubData, initialData.locationData),
				contextTitle: getPubPageContextTitle(pubData, initialData.communityData),
				description: pubData.description,
				doi: pubData.doi,
				pdfDownloadUrl: getPdfDownloadUrl(initialData.communityData, pubData),
				image: pubData.avatar,
				initialData: initialData,
				notes: getGoogleScholarNotes(Object.values(pubData.initialStructuredCitations)),
				publishedAt: getPubPublishedDate(pubData),
				textAbstract: pubData.initialDoc ? getTextAbstract(pubData.initialDoc) : '',
				title: pubData.title,
				unlisted: !pubData.isRelease,
			})}
		/>,
	);
};

const getEnrichedAndSanitizedPubData = async ({
	pubSlug,
	historyKey,
	initialData,
	branchType,
	releaseNumber,
}) => {
	let pubData = await getPub(pubSlug, initialData.communityData.id);
	if (!pubData) {
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
		throw new ForbiddenError();
	}
	pubData = await sanitizePub(pubData, initialData, releaseNumber);
	if (!pubData) {
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
		throw new ForbiddenError();
	}
	pubData = await enrichPubFirebaseDoc(pubData, historyKey, branchType);
	pubData = await enrichPubFirebaseToken(pubData, initialData);
	pubData = await enrichPubCitations(pubData, initialData);
	pubData = await enrichAndSanitizePubEdges(pubData, initialData);
	return pubData;
};

app.get('/pub/:pubSlug/release/:releaseNumber', async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const { releaseNumber: releaseNumberString, pubSlug } = req.params;
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
		const initialData = await getInitialData(req);
		const releaseNumber = parseInt(releaseNumberString, 10);
		if (Number.isNaN(releaseNumber) || releaseNumber < 1) {
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
			throw new NotFoundError();
		}

		const pubData = await getEnrichedAndSanitizedPubData({
			pubSlug: pubSlug,
			historyKey: releaseNumber - 1,
			releaseNumber: releaseNumber,
			branchType: 'public',
			initialData: initialData,
		});

		return renderPubDocument(res, pubData, initialData);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

app.get(['/pub/:pubSlug/draft', '/pub/:pubSlug/draft/:historyKey'], async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
		const initialData = await getInitialData(req);
		const { historyKey: historyKeyString, pubSlug } = req.params;
		const { canViewDraft, canView } = initialData.scopeData.activePermissions;
		const hasHistoryKey = historyKeyString !== undefined;
		const historyKey = parseInt(historyKeyString, 10);
		const isHistoryKeyInvalid = hasHistoryKey && Number.isNaN(historyKey);

		if (isHistoryKeyInvalid) {
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
			throw new NotFoundError();
		}

		if (!canViewDraft && !canView) {
			// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
			throw new NotFoundError();
		}

		const pubData = await Promise.all([
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ pubSlug: any; historyKey: numb... Remove this comment to see the full error message
			getEnrichedAndSanitizedPubData({
				pubSlug: pubSlug,
				historyKey: hasHistoryKey ? historyKey : null,
				branchType: 'draft',
				initialData: initialData,
			}),
			getMembers(initialData),
		]).then(([enrichedPubData, membersData]) => ({
			...enrichedPubData,
			membersData: membersData,
		}));

		return renderPubDocument(res, pubData, initialData);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
