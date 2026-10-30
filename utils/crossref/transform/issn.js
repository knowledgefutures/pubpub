const issnPattern = /^\d{7}[\dX]$/;

/**
 * Normalizes an ISSN to the eight-character form Crossref accepts, or returns null if the value
 * isn't a well-formed ISSN. Crossref rejects a whole deposit over a malformed ISSN, so we'd
 * rather leave it out.
 */
export default (value) => {
	if (typeof value !== 'string') {
		return null;
	}
	const issn = value.replace(/[\s-]/g, '').toUpperCase();
	return issnPattern.test(issn) ? issn : null;
};
