import { Op } from 'sequelize';
import cheerio from 'cheerio';
import fetch from 'node-fetch';

import { parseUrl } from 'utils/urls';
import { assignNotNull } from 'utils/objects';
import { Community, Pub } from 'server/models';
import { getOptionsForIncludedPub } from 'server/utils/queryHelpers/pubEdgeOptions';
import { pubEdgeQueries, runQueries } from 'server/utils/scrape';

const ensureFullUrlForExternalPublication = (externalPublication, responseUrl) => {
	if (externalPublication.url && /^\//.test(externalPublication.url)) {
		const { origin } = parseUrl(responseUrl);
		const url = new URL(externalPublication.url, origin);

		return { ...externalPublication, url: url };
	}

	return externalPublication;
};

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

const mergeProposalWithCrossrefProposal = async (edge, doi) => {
	const proposalFromDoi = await createPubEdgeProposalFromCrossrefDoi(doi);

	return {
		...edge,
		externalPublication: assignNotNull(
			{},
			edge.externalPublication,
			proposalFromDoi.externalPublication,
		),
	};
};

export const createExternalPublicationFromMicrodata = ($) => {
	const script = $('script[type="application/ld+json"]').get(0);

	if (script) {
		try {
			const parsed = JSON.parse($(script).html());

			return {
				title: parsed.headline || parsed.alternativeHeadline || null,
				description: parsed.description || null,
				contributors: parsed.author
					? parsed.author.map((personOrOrganization) => personOrOrganization.name)
					: [],
				image: parsed.image ? parsed.image.url : null,
				publicationDate: parsed.datePublished ? new Date(parsed.datePublished) : null,
			};
		} catch (error) {
			return {};
		}
	}

	return {};
};

export const createPubEdgeProposalFromArbitraryUrl = async (url) => {
	const response = await fetch(url);
	const $ = cheerio.load(await response.text());
	const externalPublicationFromSelectors = runQueries($, pubEdgeQueries);
	const externalPublicationFromMicrodata = createExternalPublicationFromMicrodata($);
	const externalPublication = assignNotNull(
		{},
		externalPublicationFromMicrodata,
		externalPublicationFromSelectors,
	);
	const edge = {
		externalPublication: ensureFullUrlForExternalPublication(externalPublication, response.url),
	};
	const { doi } = externalPublication;

	return doi ? mergeProposalWithCrossrefProposal(edge, doi) : edge;
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
