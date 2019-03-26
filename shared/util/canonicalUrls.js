/**
 * Utilities for providing canonical URLs for different entities
 */

// eslint-disable-next-line import/prefer-default-export
export const communityUrl = (communityData) =>
	communityData && communityData.domain
		? `https://${communityData.domain}`
		: `https://${communityData.subdomain}.pubpub.org`;
