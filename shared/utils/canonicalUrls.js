/**
 * Utilities for providing canonical URLs for different entities
 */
import { isDuqDuq } from 'shared/utils/environment';

export const communityUrl = (community) => {
	if (community.domain) {
		if (community.domain.includes('localhost:')) {
			return `http://${community.domain}`;
		}
		return `https://${community.domain}`;
	}
	const domain = isDuqDuq() ? 'duqduq.org' : 'pubpub.org';
	return `https://${community.subdomain}.${domain}`;
};

export const collectionUrl = (community, collection) =>
	`${communityUrl(community)}/collection/${collection.id.slice(0, 8)}`;

export const pubUrl = (community, pub, ...restArgs) => {
	const baseUrl = `${communityUrl(community)}/pub/${pub.slug}`;
	if (restArgs.length === 1) {
		const [{ isDraft, historyKey, releaseNumber }] = restArgs;
		if (isDraft) {
			const appendedHistoryKey = historyKey !== undefined ? `/${historyKey}` : '';
			return `${baseUrl}/draft${appendedHistoryKey}`;
		}
		if (releaseNumber !== undefined) {
			return `${baseUrl}/release/${releaseNumber}`;
		}
		return baseUrl;
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
