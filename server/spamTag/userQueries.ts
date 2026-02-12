import type * as types from 'types';
import type { SpamStatus } from 'types';

import mergeWith from 'lodash.mergewith';

import { SpamTag, User } from 'server/models';
import { expect } from 'utils/assert';

import { getSuspectedUserSpamVerdict } from './userScore';

type SpamTagFields = {
	suspiciousFiles?: string[];
	suspiciousComments?: string[];
};

const mergeSpamTagFields = (spamTag: Pick<SpamTag, 'fields'>, fields?: SpamTagFields) => {
	if (!fields) {
		return spamTag;
	}
	if (!spamTag.fields) {
		return { ...spamTag, fields };
	}

	return {
		...spamTag,
		fields: mergeWith(spamTag.fields, fields, (a, b) => {
			if (Array.isArray(a) && Array.isArray(b)) {
				return a.concat(b);
			}
			return b ?? a;
		}),
	};
};

export const addSpamTagToUser = async (userId: string, fields?: SpamTagFields) => {
	const user = expect(
		await User.findOne({
			where: { id: userId },
			include: [{ model: SpamTag, as: 'spamTag' }],
		}),
	) as types.DefinitelyHas<User, 'spamTag'>;
	const verdict = getSuspectedUserSpamVerdict(user);
	const { spamTag } = user;
	if (spamTag) {
		const mergedSpamTag = mergeSpamTagFields(verdict, fields);

		await spamTag.update(mergedSpamTag as types.SpamVerdict<SpamTag>);
		return spamTag;
	}
	const newMergedSpamTag = mergeSpamTagFields(verdict, fields);
	const newSpamTag = await SpamTag.create(newMergedSpamTag as types.SpamVerdict<SpamTag>);
	await User.update(
		{ spamTagId: newSpamTag.id },
		{
			where: { id: userId },
			limit: 1,
			individualHooks: false,
		},
	);
	return newSpamTag;
};

type UpdateSpamTagForUserOptions = {
	userId: string;
	status: SpamStatus;
};

export const getSpamTagForUser = async (userId: string) => {
	const user = await User.findOne({
		where: { id: userId },
		include: [{ model: SpamTag, as: 'spamTag' }],
	});
	if (!user) return null;
	const u = user as types.DefinitelyHas<User, 'spamTag'>;
	return u.spamTag ?? null;
};

export const updateSpamTagForUser = async (options: UpdateSpamTagForUserOptions) => {
	const { userId, status } = options;
	const spamTag = await getSpamTagForUser(userId);
	if (spamTag) {
		await spamTag.update({ status, statusUpdatedAt: new Date() });
	} else {
		throw new Error('User is missing a SpamTag');
	}
};

export const removeSpamTagFromUser = async (userId: string) => {
	const spamTag = await getSpamTagForUser(userId);
	if (spamTag) {
		await User.update(
			{ spamTagId: null },
			{ where: { id: userId }, limit: 1, individualHooks: false },
		);
		await spamTag.destroy();
	}
};
