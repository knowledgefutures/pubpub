import type * as types from 'types';
import type { SpamStatus, UserSpamTagFields } from 'types';

import mergeWith from 'lodash.mergewith';

import { SpamTag, User } from 'server/models';
import { sendNewSpamTagDevEmail, sendSpamBanEmail, sendSpamLiftedEmail } from 'server/utils/email';
import { deleteSessionsForUser } from 'server/utils/session';
import {
	postToSlackAboutNewUserSpamTag,
	postToSlackAboutUserBan,
	postToSlackAboutUserLifted,
} from 'server/utils/slack';
import { expect } from 'utils/assert';

import { getSuspectedUserSpamVerdict } from './userScore';

const mergeSpamTagFields = (
	spamTag: Pick<SpamTag, 'fields'> | { fields: UserSpamTagFields },
	fields?: UserSpamTagFields,
) => {
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

export const addSpamTagToUser = async (userId: string, fields?: UserSpamTagFields) => {
	const user = expect(
		await User.findOne({
			where: { id: userId },
			include: [{ model: SpamTag, as: 'spamTag' }],
		}),
	) as types.DefinitelyHas<User, 'spamTag'>;
	const verdict = getSuspectedUserSpamVerdict(user);
	const { spamTag } = user;
	if (spamTag) {
		// preserve existing fields, then layer on the new ones
		const withExisting = mergeSpamTagFields(verdict, spamTag.fields as UserSpamTagFields);
		const merged = mergeSpamTagFields(withExisting, fields);

		await spamTag.update(merged as types.SpamVerdict<SpamTag>);
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
	notifyNewSpamTag(userId, user, newSpamTag).catch((err) =>
		console.error('Failed to send new spam tag notifications', err),
	);
	return newSpamTag;
};

const notifyNewSpamTag = async (userId: string, user: User, spamTag: SpamTag) => {
	const email = user.email ?? '';
	const name = user.fullName ?? '';
	const slug = user.slug ?? '';
	if (!email) return;
	await postToSlackAboutNewUserSpamTag({
		userId,
		userName: name,
		userSlug: slug,
		spamScore: spamTag.spamScore,
	});
	await sendNewSpamTagDevEmail({ userEmail: email, userName: name });
};

type UpdateSpamTagForUserOptions = {
	userId: string;
	status: SpamStatus;
	actorId?: string;
	actorName?: string;
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
	const { userId, status, actorId, actorName } = options;
	const spamTag = await getSpamTagForUser(userId);
	if (!spamTag) {
		throw new Error('User is missing a SpamTag');
	}
	await spamTag.update({ status, statusUpdatedAt: new Date() });
	await applySpamStatusSideEffects(userId, status, spamTag, actorId, actorName);
};

const applySpamStatusSideEffects = async (
	userId: string,
	status: SpamStatus,
	spamTag: SpamTag,
	actorId?: string,
	actorName?: string,
) => {
	const user = await User.findOne({
		where: { id: userId },
		attributes: ['email', 'fullName', 'slug', 'avatar'],
	});
	if (!user?.email) return;
	const userName = user.fullName ?? '';
	try {
		if (status === 'confirmed-spam') {
			try {
				await deleteSessionsForUser(user.email);
			} catch (err) {
				console.error('Failed to delete sessions for banned user', userId, err);
			}
			if (process.env.NODE_ENV === 'production') {
				await sendSpamBanEmail({ toEmail: user.email, userName });
			}
			await postToSlackAboutUserBan({
				userId,
				userName,
				userSlug: user.slug,
				userAvatar: user.avatar,
				reason: spamTag.fields as UserSpamTagFields,
				actorName,
			});
		} else if (status === 'confirmed-not-spam') {
			if (process.env.NODE_ENV === 'production') {
				await sendSpamLiftedEmail({ toEmail: user.email, userName });
			}
			await postToSlackAboutUserLifted({
				userId,
				userName,
				userSlug: user.slug,
				actorName,
			});
		}
	} catch (err) {
		console.error('Failed to send spam status email', err);
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
