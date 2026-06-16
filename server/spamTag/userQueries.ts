import type * as types from 'types';
import type { UserSpamTagFields } from 'types';

import mergeWith from 'lodash.mergewith';
import { Op } from 'sequelize';

import { syncBanToKfAuth, syncUnbanToKfAuth } from 'server/kf/oidc.server';
import {
	Collection,
	CollectionAttribution,
	Community,
	Member,
	Pub,
	PubAttribution,
	SpamTag,
	User,
} from 'server/models';
import { defer } from 'server/utils/deferred';
import { deleteSessionsForUser } from 'server/utils/session';
import { expect } from 'utils/assert';
import { schedulePurge } from 'utils/caching/schedulePurgeWithSentry';

import { getAffiliationForUserIds } from './userDashboard';
import { getSuspectedUserSpamVerdict } from './userScore';

const mergeSpamTagFields = (
	base: Pick<SpamTag, 'fields'> | { fields: UserSpamTagFields },
	extra?: UserSpamTagFields,
) => {
	if (!extra) return base;
	if (!base.fields) return { ...base, fields: extra };
	return {
		...base,
		fields: mergeWith(base.fields, extra, (a, b) => {
			if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
			return b ?? a;
		}),
	};
};

type UpsertSpamTagOptions = {
	userId: string;
	fields?: UserSpamTagFields;
	status?: types.SpamStatus;
	skipKfAuthSync?: boolean;
};

type UpsertResult = { spamTag: SpamTag; user: User };

const fetchUserWithSpamTag = async (userId: string) =>
	expect(
		await User.findOne({
			where: { id: userId },
			include: [{ model: SpamTag, as: 'spamTag' }],
		}),
	) as types.DefinitelyHas<User, 'spamTag'>;

const buildSpamTagData = (
	verdict: types.SpamVerdict<SpamTag>,
	existingFields: UserSpamTagFields | undefined,
	newFields: UserSpamTagFields | undefined,
	status: types.SpamStatus | undefined,
) => {
	const merged = mergeSpamTagFields(mergeSpamTagFields(verdict, existingFields), newFields);
	if (!status) return merged;
	return { ...merged, status, statusUpdatedAt: new Date() };
};

const invalidateUserSessions = async (user: User) => {
	if (!user.email) return;
	await deleteSessionsForUser(user.email).catch((err) =>
		console.error('Failed to delete sessions for banned user', user.id, err),
	);
};

const schedulePurgesForUser = async (userId: string) => {
	// should schedule purges for all communities the user has commented on, ugh
	const communities = await getAffiliationForUserIds([userId]);
	const communitySubdomains = communities.get(userId)?.communitySubdomains;
	if (communitySubdomains) {
		for (const communitySubdomain of communitySubdomains) {
			schedulePurge(`${communitySubdomain}.pubpub.org`);
		}
	}
};

export const upsertSpamTag = async (options: UpsertSpamTagOptions): Promise<UpsertResult> => {
	const { userId, fields, status, skipKfAuthSync } = options;
	const user = await fetchUserWithSpamTag(userId);
	const verdict = getSuspectedUserSpamVerdict(user);
	const existingTag = user.spamTag;

	if (existingTag) {
		const previousStatus = existingTag.status;
		const data = buildSpamTagData(
			verdict,
			existingTag.fields as UserSpamTagFields,
			fields,
			status,
		);
		await existingTag.update(data as types.SpamVerdict<SpamTag>);
		if (status === 'confirmed-spam' && previousStatus !== status) {
			await Promise.all([invalidateUserSessions(user), schedulePurgesForUser(userId)]);
			if (!skipKfAuthSync) {
				defer(async () => syncBanToKfAuth(userId));
			}
		}
		if (status === 'confirmed-not-spam' && previousStatus !== status && !skipKfAuthSync) {
			defer(async () => syncUnbanToKfAuth(userId));
		}
		return { spamTag: existingTag, user };
	}

	const data = buildSpamTagData(verdict, undefined, fields, status);
	const spamTag = await SpamTag.create(data as types.SpamVerdict<SpamTag>);
	await User.update(
		{ spamTagId: spamTag.id },
		{ where: { id: userId }, limit: 1, individualHooks: false },
	);
	if (status === 'confirmed-spam') {
		await Promise.all([invalidateUserSessions(user), schedulePurgesForUser(userId)]);
		if (!skipKfAuthSync) {
			defer(async () => syncBanToKfAuth(userId));
		}
	}
	if (status === 'confirmed-not-spam' && !skipKfAuthSync) {
		defer(async () => syncUnbanToKfAuth(userId));
	}
	return { spamTag, user };
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

export const removeSpamTagFromUser = async (userId: string, skipKfAuthSync?: boolean) => {
	const spamTag = await getSpamTagForUser(userId);
	if (!spamTag) return;
	const wasBanned = spamTag.status === 'confirmed-spam';
	await User.update(
		{ spamTagId: null },
		{ where: { id: userId }, limit: 1, individualHooks: false },
	);
	await spamTag.destroy();
	if (wasBanned && !skipKfAuthSync) {
		defer(async () => syncUnbanToKfAuth(userId));
	}
};

const communityInclude = [
	{
		model: Community,
		as: 'community',
		attributes: ['subdomain', 'domain'],
		include: [{ model: SpamTag, as: 'spamTag', where: { status: 'not-spam' } }],
	},
];

/**
 * gets all affiliations for a user with communities that aren't marked as spam
 */
export const getLegitimateAffiliationsForUser = async (userId: string) => {
	const [members, collectionAttributions, pubAttributions] = await Promise.all([
		Member.findAll({
			raw: true,
			where: { userId },
			limit: 1,
			attributes: ['userId', 'communityId'],
			include: communityInclude,
			// include: [{ model: Community, as: 'community', attributes: ['subdomain', 'domain'] }],
		}),
		CollectionAttribution.findAll({
			raw: true,
			limit: 1,
			where: { userId },
			attributes: ['userId'],
			include: [
				{
					model: Collection,
					as: 'collection',
					attributes: ['communityId'],
					include: communityInclude,
					// include: [
					// 	{ model: Community, as: 'community', attributes: ['subdomain', 'domain'] },
					// ],
				},
			],
		}),
		PubAttribution.findAll({
			raw: true,
			limit: 1,
			where: { userId },
			attributes: ['userId'],
			include: [
				{
					model: Pub,
					as: 'pub',
					attributes: ['communityId'],
					include: communityInclude,
					// include: [
					// 	{ model: Community, as: 'community', attributes: ['subdomain', 'domain'] },
					// ],
				},
			],
		}),
	]);

	return members?.length > 0 || collectionAttributions?.length > 0 || pubAttributions?.length > 0;
};
