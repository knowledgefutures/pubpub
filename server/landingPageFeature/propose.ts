import { Op } from 'sequelize';

import { Community, Pub } from 'server/models';
import { buildPubOptions } from 'server/utils/queryHelpers';
import { parseUrl } from 'utils/urls';

type GetProposedFeatureOptions = {
	proposal: string;
	proposalKind: 'pub' | 'community';
};

type ProposalResult = null | { pubId: string } | { communityId: string };

const extractCommunityQueryFromHostname = async (hostname: string) => {
	const communityName = hostname.split('.')[0];
	return {
		[Op.or]: [{ domain: hostname }, { subdomain: communityName }],
	};
};

const getCommunityFromHostname = async (hostname: string) => {
	const community = await Community.findOne({
		where: extractCommunityQueryFromHostname(hostname),
	});
	return community;
};

const extractPubQuery = async (proposal: string) => {
	const url = parseUrl(proposal);
	if (url) {
		const { pathname, hostname } = url;
		const matches = pathname.match(/^\/pub\/(\w+)/);
		const community = await getCommunityFromHostname(hostname);
		if (matches && community) {
			const slug = matches[1];
			return { slug };
		}
	}
	return { slug: proposal };
};

const extractCommunityQuery = async (proposal: string) => {
	const url = parseUrl(proposal);
	if (url) {
		const { hostname } = url;
		return extractCommunityQueryFromHostname(hostname);
	}
	return {
		[Op.or]: [{ domain: proposal }, { subdomain: proposal }],
	};
};

export const getProposedFeature = async (
	options: GetProposedFeatureOptions,
): Promise<ProposalResult> => {
	const { proposal, proposalKind } = options;
	if (proposalKind === 'pub') {
		const pubQuery = await extractPubQuery(proposal);
		const pub = await Pub.findOne({ where: pubQuery, ...buildPubOptions({}) });
		if (pub && pub.releases.length > 0) {
			return { pubId: pub.id };
		}
	} else if (proposalKind === 'community') {
		const communityQuery = await extractCommunityQuery(proposal);
		const community = await Community.findOne({ where: communityQuery });
		if (community) {
			return { communityId: community.id };
		}
	}
	return null;
};
