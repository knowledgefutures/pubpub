import unidecode from 'unidecode';

import { metaValueToString, metaValueToJsonSerializable } from '@pubpub/prosemirror-pandoc';

import { getSearchUsers } from 'server/search/queries';

const getAuthorsArray = (author) => {
	if (author.type === 'MetaList') {
		return author.content;
	}
	if (author.type === 'MetaInlines' || author.type === 'MetaMap') {
		return [author];
	}
	return null;
};

const getDateStringFromMetaValue = (metaDateString) =>
	new Date(metaValueToString(metaDateString)).toUTCString();

const getAttributions = async (author) => {
	if (author) {
		const authorsArray = getAuthorsArray(author);
		const authorEntries = authorsArray.map(metaValueToJsonSerializable);
		const attributions = await Promise.all(
			authorEntries.map(async (authorEntry) => {
				if (typeof authorEntry === 'string') {
					const users = await getSearchUsers(authorEntry, null);
					return { name: authorEntry, users: users.map((user) => user.toJSON()) };
				}
				return authorEntry;
			}),
		);
		return attributions;
	}
	return [];
};

const stripFalseyValues = (object) =>
	Object.fromEntries(Object.entries(object).filter((kv) => kv[1]));

export const getProposedMetadata = async (meta) => {
	const { title, subtitle, author, authors, date, pubMetadata, slug } = meta;
	return stripFalseyValues({
		slug: slug && unidecode(metaValueToString(slug)),
		title: title && metaValueToString(title),
		description: subtitle && metaValueToString(subtitle),
		attributions: await getAttributions(authors || author),
		customPublishedAt: date && getDateStringFromMetaValue(date),
		metadata: pubMetadata !== undefined && metaValueToJsonSerializable(pubMetadata),
	});
};

export const getRawMetadata = (meta) => {
	return Object.fromEntries(
		Object.entries(meta).map(([key, value]) => [key, metaValueToJsonSerializable(value)]),
	);
};
