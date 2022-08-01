/**
 * Utilities for providing canonical URLs for different entities
 */
import queryString from 'query-string';

import { isDuqDuq, isQubQub } from 'utils/environment';

export const profileUrl = (userSlug) => `/user/${userSlug}`;

export const communityUrl = (community) => {
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

export const collectionUrl = (community, collection) =>
	`${communityUrl(community)}/${collection.slug}`;

export const pubShortUrl = (pub) => {
	return `https://pubpub.org/pub/${pub.slug}`;
};

export const pubUrl = (community, pub, options = {}) => {
	const skipCommunity = community === null || isQubQub();
	const baseCommunityUrl = skipCommunity ? '' : communityUrl(community);
	let baseUrl = `${baseCommunityUrl}/pub/${pub.slug}`;
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
		isReview,
	} = options;

	if (isReview && historyKey && accessHash) {
		baseUrl = `${baseCommunityUrl}/pub/${pub.slug}/review/${historyKey}`;
		const url = queryString.stringifyUrl(
			{ url: baseUrl, query: { access: accessHash, ...query } },
			{ skipNull: true },
		);
		return url;
	}

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

export const pageUrl = (community, page) => `${communityUrl(community)}/${page.slug}`;
