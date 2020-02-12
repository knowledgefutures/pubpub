import queryString from 'query-string';
import { splitThreads } from 'utils';
import { Collection, Community, Page, User, Pub, CollectionPub, Thread } from '../models';
import { getScopeData } from './scopeData';

const isPubPubProduction = !!process.env.PUBPUB_PRODUCTION;

export const getCounts = async (scopeElements) => {
	/* Get counts for threads, reviews, and forks */
	const { activeTarget, activeTargetType } = scopeElements;
	let discussionCount = 0;
	let reviewCount = 0;
	let forkCount = 0;
	let pubs = [];
	const pubQueryOptions = {
		attributes: ['id'],
		include: [
			{
				model: Thread,
				as: 'threads',
				attributes: ['id', 'isClosed', 'forkId', 'reviewId'],
			},
		],
	};
	if (activeTargetType === 'pub') {
		const pubData = await Pub.findOne({
			where: { id: activeTarget.id },
			...pubQueryOptions,
		});
		pubs = [pubData];
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
		pubs = collectionData.collectionPubs;
	}
	if (activeTargetType === 'community') {
		const communityCountData = await Community.findOne({
			where: { id: activeTarget.id },
			attributes: ['id'],
			include: [{ model: Pub, as: 'pubs', ...pubQueryOptions }],
		});
		pubs = communityCountData.pubs;
	}
	pubs.forEach((pub) => {
		const openThreads = pub.threads.filter((thread) => {
			return !thread.isClosed;
		});
		const { discussions, forks, reviews } = splitThreads(openThreads);
		reviewCount += discussions.length;
		forkCount += forks.length;
		discussionCount += reviews.length;
	});

	return {
		discussionCount: discussionCount,
		forkCount: forkCount,
		reviewCount: reviewCount,
	};
};

const cleanCommunityData = (communityData, locationData, scopeData) => {
	const cleanedData = { ...communityData };
	const isCommunityAdmin = scopeData.activePermissions.canAdminCommunity;
	const availablePages = {};
	cleanedData.pages = cleanedData.pages.filter((item) => {
		if (!scopeData && !item.isPublic && locationData.query.access !== item.viewHash) {
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
		return isCommunityAdmin || item.isPublic;
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
};
const getBaseCommunityData = (locationData, whereQuery) => {
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

		return communityResult.toJSON();
	});
};

export const getInitialData = async (req, isDashboard) => {
	const hostname = req.hostname;

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
	const whereQuery =
		hostname.indexOf('.pubpub.org') > -1
			? { subdomain: hostname.replace('.pubpub.org', '') }
			: { domain: hostname };
	const communityData = await getBaseCommunityData(locationData, whereQuery);
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
		acessHash: locationData.query.access,
		loginId: loginData.id,
	});
	const activeCounts = isDashboard ? await getCounts(scopeData.elements) : {};
	const enhancedScopeData = {
		...scopeData,
		activeCounts: activeCounts,
	};
	const cleanedCommunityData = cleanCommunityData(communityData, locationData, scopeData);
	return {
		communityData: cleanedCommunityData,
		loginData: loginData,
		locationData: locationData,
		scopeData: enhancedScopeData,
	};
};
