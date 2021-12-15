import queryString from 'query-string';

import { isProd, isDuqDuq, getAppCommit } from 'utils/environment';
import * as types from 'types';
import { getFeatureFlagsForUserAndCommunity } from 'server/featureFlag/queries';
import { UserNotification } from 'server/models';

import { getScope, getCommunity, sanitizeCommunity } from './queryHelpers';

const getNotificationData = async (
	userId: null | string,
): Promise<types.InitialNotificationsData> => {
	if (userId) {
		const userNotifications: Pick<types.UserNotification, 'id' | 'isRead'>[] =
			await UserNotification.findAll({
				where: { userId },
				attributes: ['id', 'isRead'],
			});
		const hasUnreadNotifications = userNotifications.some((n) => !n.isRead);
		return { hasNotifications: userNotifications.length > 0, hasUnreadNotifications };
	}
	return { hasNotifications: false, hasUnreadNotifications: false };
};

export const getInitialData = async (req, isDashboard = false): Promise<types.InitialData> => {
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
		isProd: isProd(),
		isDuqDuq: isDuqDuq(),
		appCommit: getAppCommit(),
	};

	/* If basePubPub - return fixed data */
	if (locationData.isBasePubPub) {
		const [featureFlags, initialNotificationsData] = await Promise.all([
			getFeatureFlagsForUserAndCommunity(loginData.id, null),
			getNotificationData(user.id),
		]);

		return {
			communityData: {
				title: 'PubPub',
				description: 'Collaborative Community Publishing',
				favicon: `https://${locationData.hostname}/favicon.png`,
				avatar: `https://${locationData.hostname}/static/logo.png`,
				headerLogo:
					locationData.path === '/' ? '/static/logo.png' : '/static/logoBlack.svg',
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
				collections: [],
			} as any,
			loginData,
			locationData,
			featureFlags,
			scopeData: { activePermissions: {} } as types.ScopeData,
			initialNotificationsData,
		};
	}

	/* If we have a community to find, search, and then return */
	const whereQuery =
		hostname.indexOf('.pubpub.org') > -1
			? { subdomain: hostname.replace('.pubpub.org', '') }
			: { domain: hostname };
	const communityData = await getCommunity(locationData, whereQuery);
	if (
		communityData.domain &&
		whereQuery.subdomain &&
		process.env.NODE_ENV === 'production' &&
		isProd()
	) {
		throw new Error(`UseCustomDomain:${communityData.domain}`);
	}
	if (req.headers.localhost) {
		/* eslint-disable-next-line no-param-reassign */
		communityData.domain = req.headers.localhost;
	}
	const [scopeData, featureFlags, initialNotificationsData] = await Promise.all([
		getScope({
			communityId: communityData.id,
			pubSlug: locationData.params.pubSlug,
			collectionSlug: locationData.params.collectionSlug || locationData.query.collectionSlug,
			accessHash: locationData.query.access,
			loginId: loginData.id,
			isDashboard,
		}),
		getFeatureFlagsForUserAndCommunity(loginData.id, communityData.id),
		getNotificationData(user.id),
	]);

	const cleanedCommunityData = sanitizeCommunity(
		communityData,
		locationData,
		loginData,
		scopeData,
	);

	return {
		communityData: cleanedCommunityData,
		loginData,
		locationData,
		scopeData,
		featureFlags,
		initialNotificationsData,
	};
};
