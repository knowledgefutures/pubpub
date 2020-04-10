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

export const pubUrl = (community, pub, ...restArgs) => {
	let baseUrl = `${communityUrl(community)}/pub/${pub.slug}`;
	if (restArgs.length === 1) {
		const [{ isDraft, historyKey, releaseNumber, accessHash }] = restArgs;
		if (isDraft) {
			const appendedHistoryKey = historyKey !== undefined ? `/${historyKey}` : '';
			baseUrl = `${baseUrl}/draft${appendedHistoryKey}`;
		}
		if (releaseNumber !== undefined) {
			baseUrl = `${baseUrl}/release/${releaseNumber}`;
		}
		return queryString.stringifyUrl(
			{ url: baseUrl, query: { access: accessHash } },
			{ skipNull: true },
		);
	}
	// TODO(ian): this entire fallback condition should be removed with Releases.
	const [branchShortId = null, versionInBranch = null] = restArgs;
	if (branchShortId) {
		return (
			baseUrl + `/branch/${branchShortId}` + (versionInBranch ? `/${versionInBranch}` : '')
		);
	}
	return baseUrl;
};

export const doiUrl = (doi) => `https://doi.org/${doi}`;
