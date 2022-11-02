import queryString from 'query-string';

import * as types from 'types';
import { isProd, isDuqDuq, isQubQub, getAppCommit, isDevelopment } from 'utils/environment';
import { getFeatureFlagsForUserAndCommunity } from 'server/featureFlag/queries';
import { UserNotification } from 'server/models';

import { getDismissedUserDismissables } from 'server/userDismissable/queries';
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

type GetInitialDataOptions = {
	isDashboard?: boolean;
	includeFacets?: boolean;
};

export const getInitialData = async (
	req,
	options: GetInitialDataOptions = {},
): Promise<types.InitialData> => {
	const hostname = req.hostname;
	const { isDashboard = false, includeFacets = isDashboard } = options;
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

	const shouldForceBasePubPub = !!(isDevelopment() && process.env.FORCE_BASE_PUBPUB);

	/* Gather location data */
	const locationData = {
		hostname: req.hostname,
		path: req.path,
		params: req.params,
		query: req.query,
		queryString: req.query ? `?${queryString.stringify(req.query)}` : '',
		isDashboard,
		isBasePubPub: shouldForceBasePubPub || hostname === 'www.pubpub.org',
		isProd: isProd(),
		isDuqDuq: isDuqDuq(),
		isQubQub: isQubQub(),
		appCommit: getAppCommit(),
	};

	/* If basePubPub - return fixed data */
	if (locationData.isBasePubPub) {
		const [featureFlags, initialNotificationsData, dismissedUserDismissables] =
			await Promise.all([
				getFeatureFlagsForUserAndCommunity(loginData.id, null),
				getNotificationData(user.id),
				getDismissedUserDismissables(user.id),
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
			dismissedUserDismissables,
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

	const [scopeData, featureFlags, initialNotificationsData, dismissedUserDismissables] =
		await Promise.all([
			getScope({
				communityId: communityData.id,
				pubSlug: locationData.params.pubSlug,
				collectionSlug:
					locationData.params.collectionSlug || locationData.query.collectionSlug,
				accessHash: locationData.query.access,
				loginId: loginData.id,
				isDashboard,
				includeFacets,
			}),
			getFeatureFlagsForUserAndCommunity(loginData.id, communityData.id),
			getNotificationData(user.id),
			getDismissedUserDismissables(user.id),
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
		dismissedUserDismissables,
	};
};
