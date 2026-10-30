const issnPattern = /^\d{7}[\dX]$/;

const hasValidCheckDigit = (issn) => {
	const sum = [...issn.slice(0, 7)].reduce((acc, digit, i) => acc + Number(digit) * (8 - i), 0);
	const check = (11 - (sum % 11)) % 11;
	return issn[7] === (check === 10 ? 'X' : String(check));
};

/**
 * Normalizes an ISSN to the eight-character form Crossref accepts, or returns null if the value
 * isn't a valid ISSN (wrong shape or check digit). Crossref rejects a whole deposit over a
 * malformed ISSN, so we'd rather leave it out.
 */
export default (value) => {
	if (typeof value !== 'string') {
		return null;
	}
	// Editors paste ISSNs with spaces and en or em dashes as often as hyphens.
	const issn = value.replace(/[\s\-\u2010-\u2015]/g, '').toUpperCase();
	return issnPattern.test(issn) && hasValidCheckDigit(issn) ? issn : null;
};
