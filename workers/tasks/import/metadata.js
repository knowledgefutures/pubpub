import { metaValueToString } from '@pubpub/prosemirror-pandoc';

import { getSearchUsers } from 'server/search/queries';

const getAuthorsArray = (author) => {
	if (author) {
		if (author.type === 'MetaList') {
			return author.content;
		}
		if (author.type === 'MetaInlines') {
			return [author];
		}
	}
	return null;
};

export const getProposedMetadata = async (meta) => {
	const { title, subtitle, author, date } = meta;
	const proposedMetadata = {};
	if (title) {
		proposedMetadata.title = metaValueToString(title);
	}
	if (subtitle) {
		proposedMetadata.description = metaValueToString(subtitle);
	}
	const authorsArray = getAuthorsArray(author);
	if (authorsArray) {
		const authorNames = authorsArray.map(metaValueToString);
		const attributions = await Promise.all(
			authorNames.map(async (authorName) => {
				const users = await getSearchUsers(authorName, null);
				return { name: authorName, users: users.map((user) => user.toJSON()) };
			}),
		);
		proposedMetadata.attributions = attributions;
	}
	if (date) {
		proposedMetadata.customPublishedAt = new Date(metaValueToString(date)).toUTCString();
	}
	return proposedMetadata;
};
