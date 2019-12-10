import { Op } from 'sequelize';
import queryString from 'query-string';
import { Collection, Community, Page, User, Pub, CollectionPub } from '../models';
import { getScopedPermissions } from './memberPermissions';

const isPubPubProduction = !!process.env.PUBPUB_PRODUCTION;

const getTargetType = (params) => {
	const { collectionSlug, pubSlug } = params;
	if (pubSlug) {
		return 'pub';
	}
	if (collectionSlug) {
		return 'collection';
	}
	return 'community';
};

export const getScopedData = async (communityData, loginData, locationData) => {
	const activeTargetType = getTargetType(locationData.params);
	let activeTarget;
	let activePub;
	let activeCollection;
	let inactiveCollections = [];
	const activeCommunity = communityData;
	let activeOrganization;
	if (activeTargetType === 'pub') {
		activeTarget = await Pub.findOne({
			where: { slug: locationData.params.pubSlug },
			include: [
				{
					model: CollectionPub,
					as: 'collectionPubs',
					required: false,
					attributes: ['id', 'pubId', 'collectionId'],
				},
			],
		});

		activePub = activeTarget;
		const collections = await Collection.findAll({
			where: { id: { [Op.in]: activeTarget.collectionPubs.map((cp) => cp.collectionId) } },
		});
		inactiveCollections = collections.filter((collection) => {
			const isActive = collection.slug === locationData.query.collectionSlug;
			if (isActive) {
				activeCollection = collection;
			}
			return !isActive;
		});
	}

	if (activeTargetType === 'collection') {
		activeTarget = await Collection.findOne({
			where: { slug: locationData.params.collectionSlug },
		});
		activeCollection = activeTarget;
	}

	return {
		activeTargetType: activeTargetType,
		activeTarget: activeTarget,
		activePub: activePub,
		activeCollection: activeCollection,
		inactiveCollections: inactiveCollections,
		activeCommunity: activeCommunity,
		activeOrganization: activeOrganization,
	};
};

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

export const getInitialData = async (req) => {
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
	loginData.isAdmin = checkIfAdmin(communityData.admins, user.id);
	if (req.headers.localhost) {
		/* eslint-disable-next-line no-param-reassign */
		communityData.domain = req.headers.localhost;
	}
	const scopedData = await getScopedData(communityData, loginData, locationData);
	const scopedPermissions = await getScopedPermissions(scopedData, loginData.id);

	return {
		communityData: communityData,
		loginData: loginData,
		locationData: locationData,
		scopedData: scopedData,
		scopedPermissions: scopedPermissions,
	};
};
