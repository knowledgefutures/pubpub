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
	getPubForRequest,
	getMembers,
	getPubCitations,
	getPubEdges,
	getPubFirebaseDraft,
	getPubFirebaseToken,
	getPubRelease,
} from 'server/utils/queryHelpers';
import { createUserScopeVisit } from 'server/userScopeVisit/queries';
import { InitialData } from 'types';

const renderPubDocument = (res, pubData, initialData) => {
	const {
		communityData: { id: communityId },
		loginData: { id: userId },
	} = initialData;
	createUserScopeVisit({ userId, communityId, pubId: pubData.id });
	return renderToNodeStream(
		res,
		<Html
			chunkName="Pub"
			initialData={initialData}
			viewData={{ pubData }}
			headerComponents={generateMetaComponents({
				attributions: pubData.attributions,
				collection: chooseCollectionForPub(pubData, initialData.locationData),
				contextTitle: getPubPageContextTitle(pubData, initialData.communityData),
				description: pubData.description,
				doi: pubData.doi,
				pdfDownloadUrl: getPdfDownloadUrl(initialData.communityData, pubData) || '',
				image: pubData.avatar,
				initialData,
				notes: getGoogleScholarNotes(Object.values(pubData.initialStructuredCitations)),
				publishedAt: getPubPublishedDate(pubData),
				textAbstract: pubData.initialDoc ? getTextAbstract(pubData.initialDoc) : '',
				title: pubData.title,
				unlisted: !pubData.isRelease,
			})}
		/>,
	);
};

const getEnrichedPubData = async ({
	pubSlug,
	initialData,
	historyKey = null,
	releaseNumber = null,
}: {
	pubSlug: string;
	initialData: InitialData;
	historyKey?: null | number;
	releaseNumber?: null | number;
}) => {
	const pubData = await getPubForRequest({
		slug: pubSlug,
		initialData,
		releaseNumber,
		getDraft: true,
		getDiscussions: true,
	});

	if (!pubData) {
		throw new ForbiddenError();
	}

	const { isRelease } = pubData;

	const getDocInfo = async () => {
		if (isRelease) {
			return getPubRelease(pubData, releaseNumber);
		}
		return {
			...(await getPubFirebaseDraft(pubData, historyKey)),
			...(await getPubFirebaseToken(pubData, initialData)),
		};
	};

	const [docInfo, edges] = await Promise.all([getDocInfo(), getPubEdges(pubData, initialData)]);
	const citations = await getPubCitations(pubData, initialData, docInfo.initialDoc);

	return {
		...pubData,
		...citations,
		...edges,
		...docInfo,
	};
};

app.get('/pub/:pubSlug/release/:releaseNumber', async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const { releaseNumber: releaseNumberString, pubSlug } = req.params;
		const initialData = await getInitialData(req);
		const releaseNumber = parseInt(releaseNumberString, 10);
		if (Number.isNaN(releaseNumber) || releaseNumber < 1) {
			throw new NotFoundError();
		}

		const pubData = await getEnrichedPubData({
			pubSlug,
			releaseNumber,
			initialData,
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
		const initialData = await getInitialData(req);
		const { historyKey: historyKeyString, pubSlug } = req.params;
		const { canViewDraft, canView } = initialData.scopeData.activePermissions;
		const hasHistoryKey = historyKeyString !== undefined;
		const historyKey = parseInt(historyKeyString, 10);
		const isHistoryKeyInvalid = hasHistoryKey && Number.isNaN(historyKey);

		if (isHistoryKeyInvalid) {
			throw new NotFoundError();
		}

		if (!canViewDraft && !canView) {
			throw new NotFoundError();
		}

		const pubData = await Promise.all([
			getEnrichedPubData({
				pubSlug,
				initialData,
				historyKey: hasHistoryKey ? historyKey : null,
			}),
			getMembers(initialData),
		]).then(([enrichedPubData, membersData]) => ({
			...enrichedPubData,
			membersData,
		}));

		return renderPubDocument(res, pubData, initialData);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
