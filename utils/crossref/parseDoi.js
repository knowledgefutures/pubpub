export const DOI_PATTERN = /^10.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/;
export const DOI_ORG_PATTERN = /doi\.org$/;

export const isDoi = (value) => typeof value === 'string' && DOI_PATTERN.test(value);

export const extractDoi = (value) => {
	const matches = value.match(DOI_PATTERN);

	if (!matches) {
		return null;
	}

	return matches[0];
};

export const extractDoiFromOrgUrl = (url) => {
	const { hostname, pathname } = url;

	if (!DOI_ORG_PATTERN.test(hostname)) {
		return null;
	}

	return extractDoi(pathname);
};
