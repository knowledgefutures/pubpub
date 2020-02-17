import queryString from 'query-string';
import { getScope, getCommunity, sanitizeCommunity } from './queryHelpers';

const isPubPubProduction = !!process.env.PUBPUB_PRODUCTION;

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
	console.time('getCommunity');
	const communityData = await getCommunity(locationData, whereQuery);
	console.timeEnd('getCommunity');
	if (communityData.domain && whereQuery.subdomain && !locationData.isDuqDuq) {
		throw new Error(`UseCustomDomain:${communityData.domain}`);
	}
	if (req.headers.localhost) {
		/* eslint-disable-next-line no-param-reassign */
		communityData.domain = req.headers.localhost;
	}
	console.time('getScope');
	const scopeData = await getScope({
		communityData: communityData,
		pubSlug: locationData.params.pubSlug,
		collectionSlug: locationData.params.collectionSlug || locationData.query.collectionSlug,
		acessHash: locationData.query.access,
		loginId: loginData.id,
		isDashboard: isDashboard,
	});
	console.timeEnd('getScope');
	console.time('sanitizeComm');
	const cleanedCommunityData = sanitizeCommunity(communityData, locationData, scopeData);
	console.timeEnd('sanitizeComm');
	return {
		communityData: cleanedCommunityData,
		loginData: loginData,
		locationData: locationData,
		scopeData: scopeData,
	};
};
