/** Utilities for providing canonical URLs for different entities */
import queryString from 'query-string';

import { isDuqDuq, isQubQub } from 'utils/environment';

export const profileUrl = (userSlug) => `/user/${userSlug}`;

export const isArchiving = () =>
	'window' in globalThis &&
	window.__pubpub_pageContextProps__.locationData.queryString.includes('pubpubArchiveBot');

/**
 * Returns the canonical URL for a community.
 * @param {Object} community - The community to get the URL for.
 * @param {string} community.subdomain - The subdomain of the community.
 * @param {string | null | undefined} [community.domain] - The domain of the community.
 * @returns The canonical URL for the community.
 */
export const communityUrl = (community) => {
	if (isArchiving()) {
		return '/';
	}
	if (isDuqDuq()) {
		return `https://${community.subdomain}.duqduq.org`;
	}
	if (community.domain) {
		if (community.domain.includes('localhost:')) {
			return `http://${community.domain}`;
		}
		return `https://${community.domain}`;
	}
	return `https://${community.subdomain}.pubpub.org`;
};

export const collectionUrl = (community, collection) => {
	if (isArchiving()) {
		return `/${collection.slug}`;
	}
	return `${communityUrl(community)}/${collection.slug}`;
};

export const pubShortUrl = (pub) => {
	return isArchiving() ? `/pub/{pub.slug}` : `https://pubpub.org/pub/${pub.slug}`;
};

export const pubUrl = (community, pub, options = {}) => {
	const {
		isDraft,
		historyKey,
		releaseNumber,
		releaseId,
		discussionId,
		accessHash,
		query,
		download,
		hash,
		absolute,
	} = options;

	// Include the community in the URL if the absolute flag is set to true.
	const skipCommunity = isArchiving() || (absolute ? false : community === null || isQubQub());
	const baseCommunityUrl = skipCommunity ? '' : communityUrl(community);

	let baseUrl = `${baseCommunityUrl}/pub/${pub.slug}`;

	if (download) {
		const downloadType = typeof download === 'string' ? `/${download}` : '';
		baseUrl = `${baseUrl}/download${downloadType}`;
	} else if (isDraft) {
		const appendedHistoryKey = historyKey !== undefined ? `/${historyKey}` : '';
		baseUrl = `${baseUrl}/draft${appendedHistoryKey}`;
	} else if (releaseNumber !== undefined) {
		baseUrl = `${baseUrl}/release/${releaseNumber}`;
	} else if (releaseId) {
		baseUrl = `${baseUrl}/release-id/${releaseId}`;
	} else if (discussionId) {
		baseUrl = `${baseUrl}/discussion-id/${discussionId}`;
	}
	const url = queryString.stringifyUrl(
		{ url: baseUrl, query: { access: accessHash, ...query } },
		{ skipNull: true },
	);
	if (hash) {
		return `${url}#${hash}`;
	}
	return url;
};

export const bestPubUrl = ({ pubData, communityData }, options = {}) => {
	if (communityData) {
		return pubUrl(communityData, pubData, options);
	}
	return pubShortUrl(pubData);
};

export const doiUrl = (doi) => `https://doi.org/${doi}`;

export const pageUrl = (community, page) => {
	return isArchiving() ? `/${page.slug}` : `${communityUrl(community)}/${page.slug}`;
};
