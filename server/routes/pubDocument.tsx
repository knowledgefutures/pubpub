import type { Request, RequestHandler, Response } from 'express';

import type { CustomScripts, InitialData, PubEdge } from 'types';

import React from 'react';

import { Router } from 'express';
import slowDown from 'express-slow-down';

import { chooseCollectionForPub } from 'client/utils/collections';
import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import Html from 'server/Html';
import { createUserScopeVisit } from 'server/userScopeVisit/queries';
import { findUserSubscription } from 'server/userSubscription/shared/queries';
import { ForbiddenError, handleErrors, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import {
	getMembers,
	getPub,
	getPubCitations,
	getPubEdges,
	getPubFirebaseDraft,
	getPubFirebaseToken,
	getPubForRequest,
	getPubRelease,
} from 'server/utils/queryHelpers';
import { createLogger } from 'server/utils/queryHelpers/communityGet';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getCorrectHostname } from 'utils/caching/getCorrectHostname';
import { pubUrl } from 'utils/canonicalUrls';
import { getNextCollectionPub } from 'utils/collections/getNextCollectionPub';
import { getPrimaryCollection } from 'utils/collections/primary';
import { getGoogleScholarNotes, getPdfDownloadUrl, getTextAbstract } from 'utils/pub/metadata';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { getPubPageContextTitle } from 'utils/pubPageTitle';

export const router = Router();

const getInitialDataForPub = (req: Request) => getInitialData(req, { includeFacets: true });

const renderPubDocument = (
	res: Response,
	pubData: Awaited<ReturnType<typeof getEnrichedPubData>> & {
		membersData?: Awaited<ReturnType<typeof getMembers>>;
	},
	initialData: InitialData,
	customScripts: CustomScripts,
) => {
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
				canonicalUrl: pubUrl(initialData.communityData, pubData),
				textAbstract: pubData.initialDoc ? getTextAbstract(pubData.initialDoc) : '',
				title: pubData.title,
				unlisted: !pubData.isRelease,
			})}
			bodyClassPrefix="pub"
		/>,
	);
};

type EnrichedPubOptions = {
	pubSlug: string;
	initialData: InitialData;
	historyKey?: null | number;
	releaseNumber?: null | number;
	includeCommunityForPubs?: boolean;
};

const getEnrichedPubData = async (options: EnrichedPubOptions) => {
	const { log, end } = createLogger('getEnrichedPubData');
	const {
		pubSlug,
		initialData,
		historyKey = null,
		releaseNumber = null,
		includeCommunityForPubs,
	} = options;

	const pubData = await log(
		'getPubForRequest',
		getPubForRequest({
			slug: pubSlug,
			initialData,
			releaseNumber,
			getSubmissions: true,
			getDraft: true,
			getDiscussions: true,
			getEdgesOptions: {
				includeCommunityForPubs,
			},
		}),
	);

	if (!pubData) {
		throw new ForbiddenError();
	}

	const { isRelease } = pubData;

	const getDocInfo = async () => {
		if (isRelease) {
			const result = await log('getPubRelease', getPubRelease(pubData, releaseNumber));
			return result;
		}

		const draft = await log('getPubFirebaseDraft', getPubFirebaseDraft(pubData, historyKey));
		const token = await log('getPubFirebaseToken', getPubFirebaseToken(pubData, initialData));
		return {
			...draft,
			...token,
		};
	};

	const currentCollectionPub = pubData.collectionPubs.find((collectionPub) =>
		collectionPub.collectionId.startsWith(initialData.locationData.query.readingCollection),
	);

	console.time('Promise.all: docInfo, edges, subscription, nextCollectionPub');
	const [docInfo, edges, subscription, nextCollectionPub] = await Promise.all([
		log('getDocInfo', getDocInfo()),
		log('getPubEdges', getPubEdges(pubData, initialData)),
		initialData.loginData.id
			? await log(
					'findUserSubscription',
					findUserSubscription({ userId: initialData.loginData.id, pubId: pubData.id }),
				)
			: null,
		currentCollectionPub
			? await log('getNextCollectionPub', getNextCollectionPub(currentCollectionPub))
			: null,
	]);

	const citations = await log(
		'getPubCitations',
		getPubCitations(pubData, initialData, docInfo.initialDoc),
	);

	const { access } = initialData.locationData.query;
	const isAVisitingCommenter = !!access && access === pubData.commentHash;
	const isReviewingPub = !!access && access === pubData.reviewHash;
	end();
	return {
		subscription: subscription?.toJSON() ?? null,
		...pubData,
		...citations,
		...edges,
		...docInfo,
		isAVisitingCommenter,
		isReviewingPub,
		nextCollectionPub,
	};
};

/**
 * `express-slow-down` causes a memory leak in Jest while testing. While testing, this is not very
 * useful anyway.
 */
const speedLimiter: RequestHandler =
	process.env.NODE_ENV === 'test'
		? (req, res, next) => next()
		: slowDown({
				windowMs: 60000, // 1 minute for requests to be kept in memory. value of 60000ms is default but expressed here for clarity
				delayAfter: 60, // allow 60 requests per minute, then...
				delayMs: 100, // 60th request has a 100ms delay, 7th has a 200ms delay, 8th gets 300ms, etc.
				maxDelayMs: 20000, // max time of request delay will be 20secs
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

/**
 * Sets the Surrogate-Key headers for pub edges on releases
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param pubData - The enriched pub data.
 * @param initialData - The initial data.
 */
const setSurrogateKeysHeadersForPubEdges = async (
	req: Request,
	res: Response,
	pubData: Awaited<ReturnType<typeof getEnrichedPubData>>,
	initialData: InitialData,
) => {
	const { outboundEdges, inboundEdges, siblingEdges } = pubData;
	const edges = (outboundEdges ?? [])
		.concat(inboundEdges ?? [])
		.concat(siblingEdges ?? []) as PubEdge[];
	if (edges.length === 0) {
		return;
	}

	const { id } = initialData.communityData;
	const hostnames = edges.reduce(
		(acc, edge: PubEdge) => {
			const { pub, targetPub } = edge;
			const maybePub = pub || targetPub;
			if (!maybePub) {
				return acc;
			}

			if (maybePub.communityId === id) {
				return acc;
			}

			const { subdomain, domain } = maybePub.community ?? {};

			const hostname = subdomain ? getCorrectHostname(subdomain, domain) : req.hostname;

			if (acc.includes(hostname)) {
				return acc;
			}

			acc.push(hostname);
			return acc;
		},
		[req.hostname] as string[],
	);

	res.setHeader('Surrogate-Key', hostnames.join(' '));
};

router.get('/pub/:pubSlug/release/:releaseNumber', speedLimiter, async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const { releaseNumber: releaseNumberString, pubSlug } = req.params;
		const { log, end } = createLogger('pubDocument:');

		const initialData = await log('getInitData', getInitialDataForPub(req));

		const releaseNumber = parseInt(releaseNumberString, 10);
		if (Number.isNaN(releaseNumber) || releaseNumber < 1) {
			throw new NotFoundError();
		}

		const [pubData, customScripts] = await Promise.all([
			log(
				'getEnriched',
				getEnrichedPubData({
					pubSlug,
					releaseNumber,
					initialData,
					includeCommunityForPubs: true,
				}),
			),
			log('getCustomScripts', getCustomScriptsForCommunity(initialData.communityData.id)),
		]);

		await log(
			'setSurrogateKeys',
			setSurrogateKeysHeadersForPubEdges(req, res, pubData, initialData),
		);

		const result = log(
			'renderPubDocument',
			renderPubDocument(res, pubData, initialData, customScripts),
		);
		end();
		return result;
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.get('/pub/:pubSlug/release-id/:releaseId', speedLimiter, async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const initialData = await getInitialDataForPub(req);
		const { pubSlug, releaseId } = req.params;
		const pub = await getPub({ slug: pubSlug, communityId: initialData.communityData.id });
		const releaseIndex = (pub.releases || []).findIndex((release) => release.id === releaseId);
		if (releaseIndex !== -1) {
			const releaseNumber = 1 + releaseIndex;
			return res.redirect(`/pub/${pubSlug}/release/${releaseNumber}`);
		}
		throw new NotFoundError();
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

router.get('/pub/:pubSlug/discussion-id/:discussionId', async (req, res, next) => {
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
		const discussion = pub.discussions?.find((disc) => disc.id === discussionId);
		if (discussion) {
			const isDiscussionOnDraft = discussion.visibility?.access !== 'public';
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

router.get(
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
