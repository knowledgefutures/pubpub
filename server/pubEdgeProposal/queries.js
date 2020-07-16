import { Op } from 'sequelize';
import cheerio from 'cheerio';
import fetch from 'node-fetch';

import { parseUrl } from 'utils/urls';
import { assignNotNull } from 'utils/objects';
import { Community, Pub } from 'server/models';
import { getOptionsForIncludedPub } from 'server/utils/queryHelpers/pubEdgeOptions';
import { pubEdgeQueries, runQueries } from 'server/utils/scrape';

const ensureFullUrlForExternalPublication = (externalPublication, responseUrl) => {
	const { origin } = parseUrl(responseUrl);

	if (externalPublication.url && /^\//.test(externalPublication.url)) {
		const url = new URL(externalPublication.url, origin);

		return { ...externalPublication, url: url };
	}
	return { ...externalPublication, url: responseUrl.toString() };
};

export const createExternalPublicationFromCrossrefDoi = async (doi) => {
	const response = await fetch(`https://api.crossref.org/works/${doi}`);

	if (!response.ok) {
		return null;
	}

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

	let publicationDate = null;

	const date = publishedOnline || publishedPrint;

	if (date) {
		publicationDate = new Date(date['date-parts']);
	}

	return {
		avatar: null,
		contributors: contributors,
		description: abstract,
		doi: DOI,
		publicationDate: publicationDate,
		title: Array.isArray(title) ? title[0] : title,
		url: URL,
	};
};

export const createPubEdgeProposalFromCrossrefDoi = async (doi) => {
	const externalPublication = await createExternalPublicationFromCrossrefDoi(doi);

	return externalPublication
		? {
				externalPublication: externalPublication,
		  }
		: null;
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

	if (!response.ok) {
		return null;
	}

	const $ = cheerio.load(await response.text());
	const externalPublicationFromSelectors = runQueries($, pubEdgeQueries);
	const externalPublicationFromMicrodata = createExternalPublicationFromMicrodata($);

	let externalPublication = assignNotNull(
		{},
		externalPublicationFromMicrodata,
		externalPublicationFromSelectors,
	);

	const { doi } = externalPublication;

	if (doi) {
		const externalPublicationFromCrossrefDoi = await createExternalPublicationFromCrossrefDoi(
			doi,
		);

		externalPublication = assignNotNull(
			{},
			externalPublicationFromCrossrefDoi,
			externalPublication,
		);
	}

	return {
		externalPublication: ensureFullUrlForExternalPublication(externalPublication, response.url),
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
