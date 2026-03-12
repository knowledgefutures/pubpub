import type { BanReason, BanStatus } from 'types';

import { Community, CommunityBan, SpamTag, ThreadComment, User } from 'server/models';
import { contextFromUser, notify } from 'server/spamTag/notifications';

type CreateBanOptions = {
	userId: string;
	communityId: string;
	actorId: string;
	reason: BanReason;
	reasonText?: string | null;
	sourceThreadCommentId?: string | null;
	spamTagId?: string | null;
};

export const createBan = async (options: CreateBanOptions) => {
	const { userId, communityId, actorId, reason, reasonText, sourceThreadCommentId, spamTagId } =
		options;
	const ban = await CommunityBan.create({
		userId,
		communityId,
		actorId,
		reason,
		reasonText: reasonText ?? null,
		sourceThreadCommentId: sourceThreadCommentId ?? null,
		spamTagId: spamTagId ?? null,
	});
	return ban.toJSON();
};

export const updateBanStatus = async (banId: string, status: BanStatus, actorId?: string) => {
	const ban = await CommunityBan.findByPk(banId);
	if (!ban) return null;
	await ban.update({
		status,
		// set the retractor to the actor who is retracting the ban
		...(actorId ? { actorId } : {}),
	});
	return ban.toJSON();
};

export const getActiveBansForUserInCommunity = async (
	userId: string,
	communityId: string,
): Promise<CommunityBan[]> => {
	return CommunityBan.findAll({
		where: { userId, communityId, status: 'active' },
	});
};

export const isUserBannedInCommunity = async (
	userId: string,
	communityId: string,
): Promise<boolean> => {
	const user = await CommunityBan.findOne({
		where: { userId, communityId, status: 'active' },
	});
	return user !== null;
};

export const isUserBannedInCommunityByHostname = async (
	userId: string,
	hostname: string,
): Promise<boolean> => {
	const subdomain = hostname.replace(/\.pubpub\.org$|\.duqduq\.org$/, '');
	const user = await CommunityBan.findOne({
		raw: true,
		where: { userId, status: 'active', '$community.subdomain$': subdomain },
		include: [{ model: Community, as: 'community', where: { subdomain } }],
	});
	return user !== null;
};

export const getBansForCommunity = async (communityId: string) => {
	return CommunityBan.findAll({
		where: { communityId },
		order: [['createdAt', 'DESC']],
		include: [
			{ model: User, as: 'user', attributes: ['id', 'fullName', 'slug', 'email'] },
			{ model: User, as: 'actor', attributes: ['id', 'fullName', 'slug'] },
			{ model: ThreadComment, as: 'sourceThreadComment', attributes: ['id', 'text'] },
			{ model: SpamTag, as: 'spamTag', attributes: ['id', 'status'] },
		],
	});
};

export const getActiveBannedUsersForCommunity = async (communityId: string) => {
	return CommunityBan.findAll({
		where: { communityId, status: 'active' },
		order: [['createdAt', 'DESC']],
		include: [
			{
				model: User,
				as: 'user',
				attributes: ['id', 'fullName', 'slug', 'avatar', 'initials'],
			},
			{ model: User, as: 'actor', attributes: ['id', 'fullName', 'slug'] },
		],
	});
};

export const getAllActiveBans = async () => {
	return CommunityBan.findAll({
		where: { status: 'active' },
		order: [['createdAt', 'DESC']],
		include: [
			{ model: User, as: 'user', attributes: ['id', 'fullName', 'slug', 'email'] },
			{ model: User, as: 'actor', attributes: ['id', 'fullName', 'slug'] },
			{ model: Community, as: 'community', attributes: ['id', 'subdomain'] },
			{ model: ThreadComment, as: 'sourceThreadComment', attributes: ['id', 'text'] },
			{ model: SpamTag, as: 'spamTag', attributes: ['id', 'status'] },
		],
	});
};

export const getBanById = async (banId: string) => {
	return CommunityBan.findByPk(banId, {
		include: [
			{ model: User, as: 'user', attributes: ['id', 'fullName', 'slug', 'email'] },
			{ model: User, as: 'actor', attributes: ['id', 'fullName', 'slug'] },
			{ model: Community, as: 'community', attributes: ['id', 'subdomain'] },
			{ model: SpamTag, as: 'spamTag', attributes: ['id', 'status'] },
		],
	});
};

export const getActiveBanCountForUser = async (userId: string): Promise<number> => {
	return CommunityBan.count({
		where: { userId, status: 'active' },
	});
};

export const getBanByIdAndActor = async (
	banId: string,
	actorId: string,
): Promise<CommunityBan | null> => {
	return CommunityBan.findOne({
		where: { id: banId, actorId },
	});
};

export const getActiveBanIdsForUserInCommunity = async (
	userId: string,
	communityId: string,
): Promise<string[]> => {
	const bans = await CommunityBan.findAll({
		where: { userId, communityId, status: 'active' },
		attributes: ['id'],
	});
	return bans.map((r) => r.id);
};

export const notifyBannersOfCommunityBanResolution = async (
	userId: string,
	bannedUser: {
		id: string;
		email?: string | null;
		fullName?: string | null;
		slug: string;
		avatar?: string | null;
	},
	resolution: string,
) => {
	const bans = await CommunityBan.findAll({
		where: { userId, status: 'active' },
		attributes: ['actorId', 'communityId'],
	});
	if (bans.length === 0) return;

	const actorIds = [...new Set(bans.map((r) => r.actorId))];
	const actors = await User.findAll({
		where: { id: actorIds },
		attributes: ['id', 'email', 'fullName', 'slug'],
	});
	const actorMap = new Map(actors.map((u) => [u.id, u]));

	await Promise.all(
		bans.map((ban) => {
			const actor = actorMap.get(ban.actorId);
			if (!actor?.email) return Promise.resolve();
			return notify(
				'community-flag-resolved',
				contextFromUser(bannedUser, {
					communityId: ban.communityId,
					actorFullName: actor.fullName ?? '',
					actorSlug: actor.slug ?? '',
					actorEmail: actor.email,
					resolution,
				}),
			);
		}),
	);
};
