export const ORCID_PATTERN = /(\d{4}-){3}\d{3}(\d|X)/;

export const ORCID_ID_OR_URL_PATTERN =
	/^(?:(?:https?:\/\/)?(?:www\.)?orcid\.org\/)?(\d{4}-){3}\d{3}(\d|X)$/g;

/**
 * extracts the bare ORCID identifier (e.g. 0000-0001-2345-6789) from a string
 * that may be a full URL, a bare ID, or anything in between. returns null if no
 * valid ORCID can be found.
 */
export const normalizeOrcid = (value: string | null | undefined): string | null => {
	if (!value) return null;

	const match = value.match(ORCID_PATTERN);
	return match?.[0] ?? null;
};
