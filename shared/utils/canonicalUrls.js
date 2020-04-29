/**
 * Utilities for providing canonical URLs for different entities
 */
import queryString from 'query-string';

import { isDuqDuq } from 'shared/utils/environment';

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
	`${communityUrl(community)}/collection/${collection.id.slice(0, 8)}`;

export const pubUrl = (community, pub, options = {}) => {
	let baseUrl = `${communityUrl(community)}/pub/${pub.slug}`;
	const { isDraft, historyKey, releaseNumber, accessHash, query } = options;
	if (isDraft) {
		const appendedHistoryKey = historyKey !== undefined ? `/${historyKey}` : '';
		baseUrl = `${baseUrl}/draft${appendedHistoryKey}`;
	} else if (releaseNumber !== undefined) {
		baseUrl = `${baseUrl}/release/${releaseNumber}`;
	}
	return queryString.stringifyUrl(
		{ url: baseUrl, query: { access: accessHash, ...query } },
		{ skipNull: true },
	);
};

export const doiUrl = (doi) => `https://doi.org/${doi}`;
