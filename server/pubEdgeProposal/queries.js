import { Op } from 'sequelize';
import fetch from 'node-fetch';

import { Community, Pub } from 'server/models';
import { getOptionsForIncludedPub } from 'server/utils/queryHelpers/edgeOptions';

export const createPubEdgeProposalFromCrossrefDoi = async (doi) => {
	const response = await fetch(`https://api.crossref.org/works/${doi}`);
	const { message } = await response.json();
	const {
		abstract,
		author,
		DOI,
		title,
		URL,
		'published-online': publishedOnline,
		'published-print': publishedPrint,
	} = message;
	const contributors = author ? author.map(({ given, family }) => `${given} ${family}`) : [];
	const dateParts = (publishedOnline || publishedPrint)['date-parts'];
	const publicationDate = new Date(dateParts);

	return {
		externalPublication: {
			avatar: null,
			contributors: contributors,
			description: abstract,
			doi: DOI,
			publicationDate: publicationDate,
			title: Array.isArray(title) ? title[0] : title,
			url: URL,
		},
	};
};

export const getPubDataFromUrl = async (url) => {
	const { hostname, pathname } = url;
	const matches = pathname.match(/^\/pub\/(\w+)/);

	if (!matches) {
		return null;
	}

	const communityName = hostname.split('.')[0];
	const slug = matches[1];

	const community = await Community.findOne({
		where: {
			[Op.or]: [{ domain: hostname }, { subdomain: communityName }],
		},
	});

	if (!community) {
		return null;
	}

	const pub = await Pub.findOne({
		where: {
			communityId: community.id,
			slug: slug,
		},
		include: getOptionsForIncludedPub({ includeCommunity: false }),
	});

	return pub || null;
};
