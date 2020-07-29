import fuzzysearch from 'fuzzysearch';

import ensureUserForAttribution from 'utils/ensureUserForAttribution';

const authorsNamesFromPub = (pub) =>
	pub.attributions.map(ensureUserForAttribution).map((attr) => attr.user.fullName);

const matchPubAttribute = (pub, text, attribute) => fuzzysearch(text, pub[attribute].toLowerCase());

const matchAuthors = (pub, text) =>
	authorsNamesFromPub(pub).some((authorName) => fuzzysearch(text, authorName.toLowerCase()));

export const fuzzyMatchPub = (pub, filterText) => {
	const normalizedFilterText = (filterText || '').toLowerCase().trim();
	if (!normalizedFilterText) {
		return true;
	}
	return (
		['title', 'id', 'slug'].some((attribute) =>
			matchPubAttribute(pub, normalizedFilterText, attribute),
		) || matchAuthors(pub, normalizedFilterText)
	);
};

export const fuzzyMatchCollection = (collection, filterText) => {
	return !filterText || fuzzysearch(filterText.toLowerCase(), collection.title.toLowerCase());
};
