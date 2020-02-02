import queryString from 'query-string';
import {
	Collection,
	Community,
	Page,
	User,
	Pub,
	CollectionPub,
	Merge,
	Review,
	Discussion,
} from '../models';
import { getScopeData } from './scopeData';

const isPubPubProduction = !!process.env.PUBPUB_PRODUCTION;

const countActiveThreads = (discussions) => {
	/* Return the number of non-archived threads from a list of discussions */
	const threadObject = {};
	discussions.forEach((discussion) => {
		const existingThread = threadObject[discussion.threadNumber];
		if (!existingThread || (existingThread && existingThread === 'active')) {
			threadObject[discussion.threadNumber] = discussion.isArchived ? 'archived' : 'active';
		}
	});
	return Object.values(threadObject).reduce((prev, curr) => {
		return curr === 'active' ? prev + 1 : prev;
	}, 0);
};

export const getCounts = async (scopeElements) => {
	/* Get counts for threads, reviews, and merges */
	const { activeTarget, activeTargetType } = scopeElements;
	let discussionCount = 0;
	let reviewCount = 0;
	let mergeCount = 0;
	const pubQueryOptions = {
		attributes: ['id'],
		include: [
			{
				model: Discussion,
				as: 'discussions',
				attributes: ['id', 'threadNumber', 'isArchived'],
			},
			{
				model: Review,
				as: 'reviews',
				attributes: ['id'],
			},
			{
				model: Merge,
				as: 'merges',
				attributes: ['id'],
			},
		],
	};
	if (activeTargetType === 'pub') {
		const pubData = await Pub.findOne({
			where: { id: activeTarget.id },
			...pubQueryOptions,
		});
		discussionCount = countActiveThreads(pubData.discussions);
		reviewCount = pubData.reviews.length;
		mergeCount = pubData.merges.length;
	}

	if (activeTargetType === 'collection') {
		const collectionData = await Collection.findOne({
			where: { id: activeTarget.id },
			attributes: ['id'],
			include: [
				{
					model: CollectionPub,
					as: 'collectionPubs',
					include: [{ model: Pub, as: 'pub', ...pubQueryOptions }],
				},
			],
		});
		discussionCount = collectionData.collectionPubs.reduce((prev, curr) => {
			return prev + countActiveThreads(curr.pub.discussions);
		}, 0);
		reviewCount = collectionData.collectionPubs.reduce((prev, curr) => {
			return prev + curr.pub.reviews.length;
		}, 0);

		mergeCount = collectionData.collectionPubs.reduce((prev, curr) => {
			return prev + curr.pub.merges.length;
		}, 0);
	}
	if (activeTargetType === 'community') {
		const communityCountData = await Community.findOne({
			where: { id: activeTarget.id },
			attributes: ['id'],
			include: [{ model: Pub, as: 'pubs', ...pubQueryOptions }],
		});
		discussionCount = communityCountData.pubs.reduce((prev, curr) => {
			return prev + countActiveThreads(curr.discussions);
		}, 0);
		reviewCount = communityCountData.pubs.reduce((prev, curr) => {
			return prev + curr.reviews.length;
		}, 0);

		mergeCount = communityCountData.pubs.reduce((prev, curr) => {
			return prev + curr.merges.length;
		}, 0);
	}

	return {
		discussionCount: discussionCount,
		reviewCount: reviewCount,
		mergeCount: mergeCount,
	};
};

// TODO: This is deprecated and needs to be reconsidered
const checkIfAdmin = (admins, userId) => {
	return admins.reduce((prev, curr) => {
		if (curr.id === userId) {
			return true;
		}
		return prev;
	}, false);
};

export const getBaseCommunityData = (locationData, whereQuery, userId) => {
	return Community.findOne({
		where: whereQuery,
		attributes: {
			exclude: ['createdAt', 'updatedAt'],
		},
		include: [
			{
				model: Page,
				as: 'pages',
				attributes: {
					exclude: ['createdAt', 'updatedAt', 'communityId'],
				},
			},
			{
				model: User,
				as: 'admins',
				through: { attributes: [] },
				attributes: ['id', 'slug', 'fullName', 'initials', 'avatar'],
			},
			{
				model: Collection,
				as: 'collections',
				separate: true,
			},
		],
	}).then((communityResult) => {
		if (!communityResult) {
			return null;
		}

		const cleanedData = communityResult.toJSON();
		const isAdmin = checkIfAdmin(cleanedData.admins, userId);

		const availablePages = {};
		cleanedData.pages = cleanedData.pages.filter((item) => {
			if (!isAdmin && !item.isPublic && locationData.query.access !== item.viewHash) {
				return false;
			}

			availablePages[item.id] = {
				id: item.id,
				title: item.title,
				slug: item.slug,
			};
			return true;
		});

		cleanedData.collections = cleanedData.collections.filter((item) => {
			return isAdmin || item.isPublic;
		});

		cleanedData.collections = cleanedData.collections.map((collection) => {
			if (!collection.pageId) {
				return collection;
			}
			return {
				...collection,
				page: availablePages[collection.pageId],
			};
		});
		return cleanedData;
	});
};

export const getInitialData = async (req, isDashboard) => {
	const hostname = req.hostname;
	const whereQuery =
		hostname.indexOf('.pubpub.org') > -1
			? { subdomain: hostname.replace('.pubpub.org', '') }
			: { domain: hostname };

	/* Gather user data */
	const user = req.user || {};
	const loginData = {
		id: user.id || null,
		initials: user.initials,
		slug: user.slug,
		fullName: user.fullName,
		firstName: user.firstName,
		lastName: user.lastName,
		avatar: user.avatar,
		title: user.title,
		gdprConsent: user.gdprConsent,
	};

	/* Gather location data */
	const locationData = {
		hostname: req.hostname,
		path: req.path,
		params: req.params,
		query: req.query,
		queryString: req.query ? `?${queryString.stringify(req.query)}` : '',
		isBasePubPub: hostname === 'www.pubpub.org',
		isPubPubProduction: isPubPubProduction,
		isDuqDuq: req.isDuqDuq,
	};

	/* If basePubPub - return fixed data */
	if (locationData.isBasePubPub) {
		return {
			communityData: {
				title: 'PubPub',
				description: 'Collaborative Community Publishing',
				favicon: `https://${locationData.hostname}/favicon.png`,
				avatar: `https://${locationData.hostname}/static/logo.png`,
				headerLogo:
					locationData.path === '/' ? '/static/logoWhite.svg' : '/static/logoBlack.svg',
				hideHero: true,
				accentColorLight: '#ffffff',
				accentColorDark: '#112233',
				headerColorType: 'light',
				hideCreatePubButton: true,
				headerLinks: [
					{ title: 'About', url: '/about' },
					{ title: 'Pricing', url: '/pricing' },
					{ title: 'Search', url: '/search' },
					{ title: 'Contact', url: 'mailto:hello@pubpub.org', external: true },
				],
			},
			loginData: loginData,
			locationData: locationData,
		};
	}

	/* If we have a community to find, search, and then return */
	const communityData = await getBaseCommunityData(locationData, whereQuery, user.id);
	if (!communityData) {
		throw new Error('Community Not Found');
	}
	if (communityData.domain && whereQuery.subdomain && !locationData.isDuqDuq) {
		throw new Error(`UseCustomDomain:${communityData.domain}`);
	}
	// loginData.isAdmin = checkIfAdmin(communityData.admins, user.id);
	if (req.headers.localhost) {
		/* eslint-disable-next-line no-param-reassign */
		communityData.domain = req.headers.localhost;
	}
	const scopeData = await getScopeData({
		communityData: communityData,
		pubSlug: locationData.params.pubSlug,
		collectionSlug: locationData.params.collectionSlug || locationData.query.collectionSlug,
		loginId: loginData.id,
	});
	const activeCounts = isDashboard ? await getCounts(scopeData.elements) : {};
	const enhancedScopeData = {
		...scopeData,
		activeCounts: activeCounts,
	};
	return {
		communityData: communityData,
		loginData: loginData,
		locationData: locationData,
		scopeData: enhancedScopeData,
	};
};
