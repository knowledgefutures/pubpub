import React from 'react';
import slowDown from 'express-slow-down';

import { getPubPageContextTitle } from 'utils/pubPageTitle';
import { getPrimaryCollection } from 'utils/collections/primary';
import { getPdfDownloadUrl, getTextAbstract, getGoogleScholarNotes } from 'utils/pub/metadata';
import { chooseCollectionForPub } from 'client/utils/collections';
import Html from 'server/Html';
import app, { wrap } from 'server/server';
import { handleErrors, NotFoundError, ForbiddenError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { generateHash } from 'utils/hashes';
import {
	getPubForRequest,
	getMembers,
	getPubCitations,
	getPubEdges,
	getPubFirebaseDraft,
	getPubFirebaseToken,
	getPubRelease,
	getPub,
} from 'server/utils/queryHelpers';
import { createUserScopeVisit } from 'server/userScopeVisit/queries';
import { InitialData } from 'types';
import { findUserSubscription } from 'server/userSubscription/shared/queries';
import { Pub } from 'server/models';

const getInitialDataForPub = (req) => getInitialData(req, { includeFacets: true });

const renderPubDocument = (res, pubData, initialData, customScripts) => {
	const {
		communityData: { id: communityId },
		loginData: { id: userId },
	} = initialData;
	createUserScopeVisit({ userId, communityId, pubId: pubData.id });
	const { collectionPubs } = pubData;
	const primaryCollection = collectionPubs && getPrimaryCollection(collectionPubs);
	const collectionAttributions = primaryCollection?.attributions ?? [];
	return renderToNodeStream(
		res,
		<Html
			chunkName="Pub"
			initialData={initialData}
			viewData={{ pubData }}
			customScripts={customScripts}
			headerComponents={generateMetaComponents({
				attributions: [...pubData.attributions, ...collectionAttributions],
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
			bodyClassPrefix="pub"
		/>,
	);
};

const getEnrichedPubData = async ({
	pubSlug,
	initialData,
	historyKey = null,
	releaseNumber = null,
	isReview = false,
}: {
	pubSlug: string;
	initialData: InitialData;
	historyKey?: null | number;
	releaseNumber?: null | number;
	isReview?: boolean;
}) => {
	const pubData = await getPubForRequest({
		slug: pubSlug,
		initialData,
		releaseNumber,
		getSubmissions: true,
		getDraft: true,
		getDiscussions: true,
		isReview,
	});

	if (!pubData) {
		throw new ForbiddenError();
	}

	if (!pubData.reviewHash) {
		const reviewHash = generateHash(8);
		Pub.update(
			{ reviewHash },
			{
				where: { id: pubData.id },
			},
		);
		pubData.reviewHash = reviewHash;
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

	const [docInfo, edges, subscription] = await Promise.all([
		getDocInfo(),
		getPubEdges(pubData, initialData),
		initialData.loginData.id
			? findUserSubscription({ userId: initialData.loginData.id, pubId: pubData.id })
			: null,
	]);
	const citations = await getPubCitations(pubData, initialData, docInfo.initialDoc);

	return {
		subscription: subscription?.toJSON() ?? null,
		...pubData,
		...citations,
		...edges,
		...docInfo,
	};
};

const speedLimiter = slowDown({
	windowMs: 60000, // 1 minute for requests to be kept in memory. value of 60000ms is default but expressed here for clarity
	delayAfter: 60, // allow 60 requests per minute, then...
	delayMs: 100, // 60th request has a 100ms delay, 7th has a 200ms delay, 8th gets 300ms, etc.
	maxDelay: 20000, // max time of request delay will be 20secs
});

const checkHistoryKey = (key) => {
	const hasHistoryKey = key !== undefined;
	const historyKey = parseInt(key, 10);
	const isHistoryKeyInvalid = hasHistoryKey && Number.isNaN(historyKey);

	if (isHistoryKeyInvalid) {
		throw new NotFoundError();
	}

	return { historyKey, hasHistoryKey };
};

app.get('/pub/:pubSlug/release/:releaseNumber', speedLimiter, async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const { releaseNumber: releaseNumberString, pubSlug } = req.params;
		const initialData = await getInitialDataForPub(req);
		const customScripts = await getCustomScriptsForCommunity(initialData.communityData.id);
		const releaseNumber = parseInt(releaseNumberString, 10);
		if (Number.isNaN(releaseNumber) || releaseNumber < 1) {
			throw new NotFoundError();
		}

		const pubData = await getEnrichedPubData({
			pubSlug,
			releaseNumber,
			initialData,
		});

		return renderPubDocument(res, pubData, initialData, customScripts);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

app.get('/pub/:pubSlug/release-id/:releaseId', speedLimiter, async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const initialData = await getInitialDataForPub(req);
		const { pubSlug, releaseId } = req.params;
		const pub = await getPub({ slug: pubSlug, communityId: initialData.communityData.id });
		const releaseIndex = pub.releases.findIndex((release) => release.id === releaseId);
		if (releaseIndex !== -1) {
			const releaseNumber = 1 + releaseIndex;
			return res.redirect(`/pub/${pubSlug}/release/${releaseNumber}`);
		}
		throw new NotFoundError();
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

app.get('/pub/:pubSlug/discussion-id/:discussionId', async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const initialData = await getInitialDataForPub(req);
		const { pubSlug, discussionId } = req.params;
		const pub = await getPub(
			{ slug: pubSlug, communityId: initialData.communityData.id },
			{ getDiscussions: true },
		);
		const discussion = pub.discussions.find((disc) => disc.id === discussionId);
		if (discussion) {
			const isDiscussionOnDraft = discussion.visibility.access !== 'public';
			const hash = `#discussion-${discussionId}`;
			if (isDiscussionOnDraft) {
				return res.redirect(`/pub/${pubSlug}/draft${hash}`);
			}
			return res.redirect(`/pub/${pubSlug}${hash}`);
		}
		throw new NotFoundError();
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

app.get(
	['/pub/:pubSlug/draft', '/pub/:pubSlug/draft/:historyKey'],
	speedLimiter,
	async (req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		try {
			const initialData = await getInitialDataForPub(req);
			const { historyKey: historyKeyString, pubSlug } = req.params;
			const { canViewDraft, canView } = initialData.scopeData.activePermissions;
			const { hasHistoryKey, historyKey } = checkHistoryKey(historyKeyString);

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
			const customScripts = await getCustomScriptsForCommunity(initialData.communityData.id);
			return renderPubDocument(res, pubData, initialData, customScripts);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);

app.get(
	['/pub/:pubSlug/review/:historyKey/'],
	wrap(async (req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}

		const initialData = await getInitialData(req);
		const { historyKey: historyKeyString, pubSlug } = req.params;
		const { canView } = initialData.scopeData.activePermissions;
		const { hasHistoryKey, historyKey } = checkHistoryKey(historyKeyString);

		if (!canView) {
			throw new NotFoundError();
		}

		const pubData = await Promise.all([
			getEnrichedPubData({
				pubSlug,
				initialData,
				historyKey: hasHistoryKey ? historyKey : null,
				isReview: true,
			}),
			getMembers(initialData),
		]).then(([enrichedPubData, membersData]) => ({
			...enrichedPubData,
			membersData,
		}));
		const customScripts = await getCustomScriptsForCommunity(initialData.communityData.id);
		return renderPubDocument(res, pubData, initialData, customScripts);
	}),
);
