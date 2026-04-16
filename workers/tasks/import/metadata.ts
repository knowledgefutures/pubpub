import type { Falsy } from 'types';

import { metaValueToJsonSerializable, metaValueToString } from '@pubpub/prosemirror-pandoc';
import unidecode from 'unidecode';

import { batchSearchUsers } from 'server/search/queries';
import { isValidDate } from 'utils/dates';

const getAuthorsArray = (author) => {
	if (author.type === 'MetaList') {
		return author.content;
	}
	if (author.type === 'MetaInlines' || author.type === 'MetaMap') {
		return [author];
	}
	return null;
};

const getDateStringFromMetaValue = (metaDateString) => {
	const date = new Date(metaValueToString(metaDateString));
	if (isValidDate(date)) {
		return date.toUTCString();
	}
	return null;
};

const getAttributions = async (author) => {
	if (author) {
		const authorsArray = getAuthorsArray(author);
		const authorEntries = authorsArray.map(metaValueToJsonSerializable) as any[];
		const stringEntries = authorEntries.filter(
			(entry): entry is string => typeof entry === 'string',
		);
		const usersByName =
			stringEntries.length > 0
				? await batchSearchUsers(stringEntries)
				: new Map<string, any[]>();
		const attributions = authorEntries.map((authorEntry) => {
			if (typeof authorEntry === 'string') {
				return { name: authorEntry, users: usersByName.get(authorEntry) ?? [] };
			}
			return authorEntry;
		});
		return attributions;
	}
	return null;
};

type Unfalsied<T extends Record<string, any>> = {
	[K in keyof T]: Exclude<T[K], Falsy>;
};

const stripFalseyValues = <T extends Record<string, any>>(object: T) =>
	Object.fromEntries(Object.entries(object).filter((kv) => kv[1])) as Unfalsied<T>;

export const getProposedMetadata = async (meta) => {
	const { title, subtitle, author, authors, date, pubMetadata, slug } = meta;
	return stripFalseyValues({
		slug: !!slug && unidecode(metaValueToString(slug)),
		title: !!title && (metaValueToString(title) as string),
		description: !!subtitle && (metaValueToString(subtitle) as string),
		attributions: await getAttributions(authors || author),
		customPublishedAt: !!date && getDateStringFromMetaValue(date),
		metadata: pubMetadata !== undefined && metaValueToJsonSerializable(pubMetadata),
	});
};

export const getRawMetadata = (meta) => {
	return Object.fromEntries(
		Object.entries(meta).map(([key, value]) => [key, metaValueToJsonSerializable(value)]),
	);
};
