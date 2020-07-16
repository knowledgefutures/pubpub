import fuzzysearch from 'fuzzysearch';

const authorsNamesFromPub = (pub) => pub.attributions.map((attr) => attr.name).filter((x) => x);

export const fuzzyMatchCollection = (collection, filterText) => {
	return !filterText || fuzzysearch(filterText.toLowerCase(), collection.title.toLowerCase());
};

export const fuzzyMatchPub = (pub, filterText) => {
	if (!filterText) {
		return true;
	}
	const titleMatch = fuzzysearch(filterText.toLowerCase(), pub.title.toLowerCase());
	const authorMatch = authorsNamesFromPub(pub).some((authorName) =>
		fuzzysearch(filterText.toLowerCase(), authorName.toLowerCase()),
	);
	return titleMatch || authorMatch;
};
