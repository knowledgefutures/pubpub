/**
 * Utilities for providing canonical URLs for different entities
 */

export const communityUrl = (community) =>
	community && community.domain
		? `https://${community.domain}`
		: `https://${community.subdomain}.pubpub.org`;

export const collectionUrl = (community, collection) =>
	`${communityUrl(community)}/collection/${collection.id.slice(0, 8)}`;

export const pubUrlV5 = (community, pub, version) => {
	const baseUrl = `${communityUrl(community)}/pub/${pub.slug}`;
	if (version) {
		return `${baseUrl}?version=${version.id}`;
	}
	return baseUrl;
};

export const pubUrl = (community, pub, branchShortId, versionInBranch) => {
	const baseUrl = `${communityUrl(community)}/pub/${pub.slug}`;
	if (branchShortId) {
		return (
			baseUrl + `/branch/${branchShortId}` + (versionInBranch ? `/${versionInBranch}` : '')
		);
	}
	return baseUrl;
};
