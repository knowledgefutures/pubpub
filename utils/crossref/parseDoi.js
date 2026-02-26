// @ts-check

export const DOI_PATTERN = /^\/?(10.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)$/;
export const DOI_ORG_PATTERN = /doi\.org$/;
export const HIGHWIRE_PATTERN = /content\/(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+?)v\d+/;
export const ARXIV_PATTERN = /arxiv\.org\/abs\/(\d{4}\.\d{4,5})/;
export const SPRINGER_PATTERN = /link\.springer\.com\/(?:chapter|article)\/(10\.\d{4,9}\/[^?#]+)/;
export const SSRN_PATTERN = /ssrn\.com\/abstract=(\d+)/;
// last resort: greedily grab anything that looks like a doi from the path
export const GENERIC_DOI_PATTERN = /(10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+)/;

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

	const { hostname, pathname, href } = url;

	if (DOI_ORG_PATTERN.test(hostname)) {
		return extractDoi(pathname);
	}

	const arxivMatch = href.match(ARXIV_PATTERN);
	if (arxivMatch) {
		return `10.48550/arXiv.${arxivMatch[1]}`;
	}

	const highwireMatch = pathname.match(HIGHWIRE_PATTERN);
	if (highwireMatch) {
		return highwireMatch[1];
	}

	const springerMatch = pathname.match(SPRINGER_PATTERN);
	if (springerMatch) {
		return decodeURIComponent(springerMatch[1]);
	}

	const ssrnMatch = href.match(SSRN_PATTERN);
	if (ssrnMatch) {
		return `10.2139/ssrn.${ssrnMatch[1]}`;
	}

	const genericMatch = pathname.match(GENERIC_DOI_PATTERN);
	if (genericMatch) {
		return genericMatch[1];
	}

	return null;
};
