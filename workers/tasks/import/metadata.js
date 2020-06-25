import { metaValueToString, metaValueToJsonSerializable } from '@pubpub/prosemirror-pandoc';

import { getSearchUsers } from 'server/search/queries';

const getAuthorsArray = (author) => {
	if (author.type === 'MetaList') {
		return author.content;
	}
	if (author.type === 'MetaInlines') {
		return [author];
	}
	return null;
};

const getDateStringFromMetaValue = (metaDateString) =>
	new Date(metaValueToString(metaDateString)).toUTCString();

const getAttributions = async (author) => {
	if (author) {
		const authorsArray = getAuthorsArray(author);
		const authorNames = authorsArray.map(metaValueToString);
		const attributions = await Promise.all(
			authorNames.map(async (authorName) => {
				const users = await getSearchUsers(authorName, null);
				return { name: authorName, users: users.map((user) => user.toJSON()) };
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
		slug: slug && metaValueToString(slug),
		title: title && metaValueToString(title),
		description: subtitle && metaValueToString(subtitle),
		attributions: await getAttributions(authors || author),
		customPublishedAt: date && getDateStringFromMetaValue(date),
		metadata: pubMetadata !== undefined && metaValueToJsonSerializable(pubMetadata),
	});
};
