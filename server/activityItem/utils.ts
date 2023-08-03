import * as types from 'types';

import { ActivityItem } from 'server/models';

export const createActivityItem = (ai: types.InsertableActivityItem) => ActivityItem.create(ai);

const jsonValuesEqual = (first: any, second: any) =>
	JSON.stringify(first) === JSON.stringify(second);

export const getDiffsForPayload = <
	Entry extends Record<string, any>,
	EntryKey extends keyof Entry,
	Diffs = Partial<{ [Key in EntryKey]: types.Diff<Entry[Key]> }>,
>(
	newEntry: Entry,
	oldEntry: Entry,
	keys: EntryKey[],
): Diffs => {
	return keys.reduce((memo: Diffs, key: EntryKey) => {
		if (jsonValuesEqual(oldEntry[key], newEntry[key])) {
			return memo;
		}
		return {
			...memo,
			[key]: {
				from: oldEntry[key],
				to: newEntry[key],
			},
		};
	}, {} as Diffs);
};

export const getChangeFlagsForPayload = <
	Entry extends Record<string, any>,
	EntryKey extends keyof Entry,
	Flags = Partial<{ [Key in EntryKey]: true }>,
>(
	newEntry: Entry,
	oldEntry: Entry,
	keys: EntryKey[],
): Flags => {
	return keys.reduce(
		(memo: Flags, key: EntryKey) =>
			jsonValuesEqual(oldEntry[key], newEntry[key]) ? memo : { ...memo, [key]: true },
		{} as Flags,
	);
};
