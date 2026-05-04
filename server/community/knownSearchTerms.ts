export type KnownSearchTerm = {
	name: string;
	aliases: string[];
};

/**
 * Parses the CONTENT_SEARCH_TERMS env var into a list of known search terms.
 *
 * The env var should be a JSON array where each element is either:
 * - a string (used as both name and sole alias)
 * - an array of strings (first element is the name, all elements are aliases)
 *
 * Example: '["National Science Foundation",["DARPA","Defense Advanced Research Projects"]]'
 */
function parseContentSearchTerms(raw: string | undefined): KnownSearchTerm[] {
	if (!raw || !raw.trim()) return [];
	try {
		const parsed = JSON.parse(raw) as (string | string[])[];
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map((entry) => {
				if (typeof entry === 'string') {
					return { name: entry, aliases: [entry] };
				}
				if (Array.isArray(entry) && entry.length > 0) {
					return { name: entry[0], aliases: entry };
				}
				return null;
			})
			.filter((t): t is KnownSearchTerm => t !== null);
	} catch {
		console.error('[knownSearchTerms] Failed to parse CONTENT_SEARCH_TERMS env var');
		return [];
	}
}

export const KNOWN_SEARCH_TERMS: KnownSearchTerm[] = parseContentSearchTerms(
	process.env.CONTENT_SEARCH_TERMS,
);
