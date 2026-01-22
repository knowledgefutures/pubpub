// @ts-check

export const DOI_PATTERN = /^\/?(10.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)$/;
export const DOI_ORG_PATTERN = /doi\.org$/;
export const HIGHWIRE_PATTERN = /content\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)v\d+$/;

export const isDoi = (value) => typeof value === 'string' && DOI_PATTERN.test(value);

/**
 * @param {string} value
 */
export const extractDoi = (value) => {
	const matches = value.match(DOI_PATTERN);

	if (!matches) {
		return null;
	}

	return matches[1];
};

/**
 * @param {URL | null} url
 */
export const extractDoiFromUrl = (url) => {
	if (!url) {
		return null;
	}

	const { hostname, pathname } = url;

	if (DOI_ORG_PATTERN.test(hostname)) {
		console.log('doi.org', pathname);
		return extractDoi(pathname);
	}


	const matches = pathname.match(HIGHWIRE_PATTERN);
	if (matches && matches[1]) {
		console.log('highwire', matches[1]);
		return matches[1];
	}

	return null;
};
