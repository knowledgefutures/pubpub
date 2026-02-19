import type * as types from 'types';

import queryString from 'query-string';

import { getFeatureFlagsForUserAndCommunity } from 'server/featureFlag/queries';
import { isUserMemberOfScope } from 'server/member/queries';
import { UserNotification } from 'server/models';
import { isUserSuperAdmin } from 'server/user/queries';
import { getDismissedUserDismissables } from 'server/userDismissable/queries';
import { getAppCommit, isDuqDuq, isProd, isQubQub, shouldForceBasePubPub } from 'utils/environment';

import { PubPubError } from './errors';
import { getCommunity, getScope, sanitizeCommunity } from './queryHelpers';

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
		return {
			hasNotifications: userNotifications.length > 0,
			hasUnreadNotifications,
		};
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
	if (req.initialData) {
		return req.initialData;
	}
	let hostname = req.hostname;
	if (hostname === 'localhost') {
		hostname = 'demo.duqduq.org';
	}

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
		isSuperAdmin: user.isSuperAdmin,
	};

	/* Gather location data */
	const locationData = {
		hostname: req.hostname,
		path: req.path,
		params: req.params,
		query: req.query,
		queryString: req.query ? `?${queryString.stringify(req.query)}` : '',
		isDashboard,
		isBasePubPub: shouldForceBasePubPub() || hostname === 'www.pubpub.org',
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
				analyticsSettings: {
					type: 'default',
					credentials: null,
				},
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

	if (communityData.spamTag && communityData.spamTag.status !== 'confirmed-not-spam') {
		const [isMemberOfCommunity, isSuperadmin] = await Promise.all([
			isUserMemberOfScope({
				userId: loginData.id,
				scope: { communityId: communityData.id },
			}),
			isUserSuperAdmin({ userId: loginData.id }),
		]);
		if (!isMemberOfCommunity && !isSuperadmin) {
			throw new PubPubError.CommunityIsSpamError();
		}
	}

	if (
		(communityData.domain &&
			whereQuery.subdomain &&
			process.env.NODE_ENV === 'production' &&
			isProd()) ||
		(communityData.domain &&
			communityData.domain === 'duqduqdomaintest.underlay.org' &&
			whereQuery.subdomain &&
			isDuqDuq())
	) {
		throw new Error(`UseCustomDomain:${communityData.domain}`);
	}
	if (req.headers.localhost) {
		communityData.domain = req.headers.localhost;
	}

	const [scopeData, featureFlags, initialNotificationsData, dismissedUserDismissables] =
		await Promise.all([
			await getScope({
				communityId: communityData.id,
				pubSlug: locationData.params.pubSlug,
				collectionSlug:
					locationData.params.collectionSlug || locationData.query.collectionSlug,
				accessHash: locationData.query.access,
				loginId: loginData.id,
				isDashboard,
				includeFacets,
			}),
			await getFeatureFlagsForUserAndCommunity(loginData.id, communityData.id),
			await getNotificationData(user.id),
			await getDismissedUserDismissables(user.id),
		]);

	const cleanedCommunityData = sanitizeCommunity(
		communityData,
		locationData,
		loginData,
		scopeData,
	);

	const result = {
		communityData: cleanedCommunityData,
		loginData,
		locationData,
		scopeData,
		featureFlags,
		initialNotificationsData,
		dismissedUserDismissables,
	};

	return result;
};
