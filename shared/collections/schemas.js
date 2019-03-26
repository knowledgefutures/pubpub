import { communityUrl } from 'shared/util/canonicalUrls';

const sharedFields = {
	doi: {
		name: 'doi',
		label: 'DOI',
		defaultDerivedFrom: ({ collection }) => collection && collection.doi,
		disabled: true,
	},
	url: {
		name: 'url',
		label: 'URL',
		defaultDerivedFrom: ({ community }) => community && communityUrl(community),
	},
};

const schemas = [
	{
		kind: 'tag',
		label: { singular: 'tag', plural: 'tags' },
		bpDisplayIcon: 'tag',
		metadata: [],
	},
	{
		kind: 'book',
		label: { singular: 'book', plural: 'books' },
		bpDisplayIcon: 'book',
		contextHints: [
			{ value: 'foreword', label: 'Foreword' },
			{ value: 'supplementaryMaterial', label: 'Supplementary Material' },
			{ value: 'chapter', label: 'Chapter', default: true },
		],
		metadata: [
			sharedFields.doi,
			sharedFields.url,
			{ name: 'isbn', label: 'ISBN' },
			{ name: 'copyrightYear', label: 'Copyright year', pattern: '^[0-9]*$' },
			{ name: 'edition', label: 'Edition no.', pattern: '^[0-9]*$' },
		],
	},
	{
		kind: 'issue',
		label: { singular: 'issue', plural: 'issues' },
		bpDisplayIcon: 'manual',
		contextHints: [{ value: 'article', label: 'Article', default: true }],
		metadata: [
			sharedFields.doi,
			sharedFields.url,
			{ name: 'printIssn', label: 'Print ISSN' },
			{ name: 'electronicIssn', label: 'Electronic ISSN' },
			{ name: 'volume', label: 'Volume' },
			{ name: 'issue', label: 'Issue' },
			{ name: 'printPublicationDate', label: 'Print publication date' },
			{ name: 'electronicPublicationDate', label: 'Electronic publication date' },
		],
	},
	{
		kind: 'conference',
		label: { singular: 'conference', plural: 'conferences' },
		bpDisplayIcon: 'presentation',
		contextHints: [{ value: 'paper', label: 'Paper', default: true }],
		metadata: [
			sharedFields.doi,
			sharedFields.url,
			{ name: 'theme', label: 'Theme' },
			{ name: 'acronym', label: 'Acronym' },
			{ name: 'location', label: 'Location' },
			{ name: 'date', label: 'Date' },
		],
	},
];

export default schemas;

export const getSchemaForKind = (kind) => {
	const result = schemas.find((s) => s.kind === kind);
	if (result) {
		return result;
	}
	throw new Error(`No collection schema of kind ${kind} has been defined`);
};
