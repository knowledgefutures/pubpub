export const DOI_PATTERN = /\b10\.(?:97[89]\.\d{2,8}\/\d{1,7}|\d{4,9}\/\S+)/;
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
