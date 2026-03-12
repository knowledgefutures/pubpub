import type { BanReason, SpamStatus, UserSpamTagFields } from 'types';

import {
	sendBanDevEmail,
	sendCommunityFlagDevEmail,
	sendCommunityFlagResolvedEmail,
	sendLiftDevEmail,
	sendNewSpamTagDevEmail,
	sendSpamBanEmail,
	sendSpamLiftedEmail,
} from './email';
import {
	postToSlackAboutCommunityFlag,
	postToSlackAboutCommunityFlagRetracted,
	postToSlackAboutNewUserSpamTag,
	postToSlackAboutSuspiciousUpload,
	postToSlackAboutUserBan,
	postToSlackAboutUserLifted,
} from './slack';

export type SpamEvent =
	| 'new-spam-tag'
	| 'suspicious-upload'
	| 'honeypot-ban'
	| 'manual-ban'
	| 'spam-lifted'
	| 'community-flag'
	| 'community-flag-retracted'
	| 'community-flag-resolved';

type SharedContext = {
	userId: string;
	userEmail: string;
	userName: string;
	userSlug: string;
	userAvatar?: string | null;
};

type NewSpamTagContext = SharedContext & {
	spamScore?: number | null;
	spamFields?: UserSpamTagFields;
};

type SuspiciousUploadContext = SharedContext & {
	uploadKey: string;
};

type HoneypotBanContext = SharedContext;

type ManualBanContext = SharedContext & {
	spamFields?: UserSpamTagFields;
	previousStatus?: SpamStatus | null;
	actorName?: string;
};

type SpamLiftedContext = SharedContext & {
	previousStatus?: SpamStatus | null;
	actorName?: string;
};

type CommunityFlagContext = SharedContext & {
	communityId: string;
	communitySubdomain: string;
	sourceThreadCommentId?: string | null;
	actorFullName: string;
	actorSlug: string;
	actorEmail: string;
	flagReason: BanReason;
	flagReasonText?: string | null;
};

type CommunityFlagRetractedContext = SharedContext & {
	communityId: string;
	communitySubdomain: string;
	actorFullName: string;
	actorSlug: string;
	actorEmail: string;
};

type CommunityFlagResolvedContext = SharedContext & {
	communityId: string;
	actorFullName: string;
	actorSlug: string;
	actorEmail: string;
	resolution: string;
};

type Handler<T extends SharedContext> = (ctx: T) => Promise<void>;

type Contexts = {
	'new-spam-tag': NewSpamTagContext;
	'suspicious-upload': SuspiciousUploadContext;
	'honeypot-ban': HoneypotBanContext;
	'manual-ban': ManualBanContext;
	'spam-lifted': SpamLiftedContext;
	'community-flag': CommunityFlagContext;
	'community-flag-retracted': CommunityFlagRetractedContext;
	'community-flag-resolved': CommunityFlagResolvedContext;
};

const handlers = {
	'new-spam-tag': [
		(ctx) =>
			postToSlackAboutNewUserSpamTag({
				userId: ctx.userId,
				userName: ctx.userName,
				userSlug: ctx.userSlug,
				spamScore: ctx.spamScore ?? null,
			}),
		(ctx) =>
			sendNewSpamTagDevEmail({
				userEmail: ctx.userEmail,
				userName: ctx.userName,
				reason: ctx.spamFields,
			}),
	],
	'suspicious-upload': [
		(ctx) =>
			postToSlackAboutSuspiciousUpload({
				userName: ctx.userName,
				uploadKey: ctx.uploadKey,
			}),
	],
	'honeypot-ban': [(ctx) => sendSpamBanEmail({ toEmail: ctx.userEmail, userName: ctx.userName })],
	'manual-ban': [
		(ctx) =>
			postToSlackAboutUserBan({
				userId: ctx.userId,
				userName: ctx.userName,
				userSlug: ctx.userSlug,
				userAvatar: ctx.userAvatar,
				reason: ctx.spamFields,
				actorName: ctx.actorName,
			}),
		(ctx) => sendSpamBanEmail({ toEmail: ctx.userEmail, userName: ctx.userName }),
		(ctx) =>
			sendBanDevEmail({
				userEmail: ctx.userEmail,
				userName: ctx.userName,
				actorName: ctx.actorName,
				reason: ctx.spamFields,
			}),
	],
	'spam-lifted': [
		async (ctx) => {
			if (!ctx.previousStatus || ctx.previousStatus === 'unreviewed') return;
			await Promise.all([
				postToSlackAboutUserLifted({
					userId: ctx.userId,
					userName: ctx.userName,
					userSlug: ctx.userSlug,
					actorName: ctx.actorName,
				}),
				sendSpamLiftedEmail({ toEmail: ctx.userEmail, userName: ctx.userName }),
				sendLiftDevEmail({ userEmail: ctx.userEmail, userName: ctx.userName }),
			]);
		},
	],
	'community-flag': [
		(ctx) =>
			postToSlackAboutCommunityFlag({
				userName: ctx.userName,
				userSlug: ctx.userSlug,
				actorName: ctx.actorFullName,
				communitySubdomain: ctx.communitySubdomain,
				reason: ctx.flagReason,
				reasonText: ctx.flagReasonText,
			}),
		(ctx) =>
			sendCommunityFlagDevEmail({
				userName: ctx.userName,
				userSlug: ctx.userSlug,
				actorFullName: ctx.actorFullName,
				actorSlug: ctx.actorSlug,
				communitySubdomain: ctx.communitySubdomain,
				flagReason: ctx.flagReason,
				flagReasonText: ctx.flagReasonText,
			}),
	],
	'community-flag-retracted': [
		(ctx) =>
			postToSlackAboutCommunityFlagRetracted({
				userName: ctx.userName,
				userSlug: ctx.userSlug,
				actorName: ctx.actorFullName,
				communitySubdomain: ctx.communitySubdomain,
				reason: 'other',
				reasonText: `Flag retracted by ${ctx.actorFullName}`,
			}),
	],
	'community-flag-resolved': [
		async (ctx) => {
			if (!ctx.actorEmail) return;
			await sendCommunityFlagResolvedEmail({
				toEmail: ctx.actorEmail,
				actorName: ctx.actorFullName,
				userName: ctx.userName,
				resolution: ctx.resolution,
			});
		},
	],
} satisfies { [K in keyof Contexts]: Handler<Contexts[K]>[] };

export const notify = async <T extends SpamEvent>(event: T, ctx: Contexts[T]): Promise<void> => {
	const results = await Promise.allSettled(handlers[event].map((h) => h(ctx)));
	for (const result of results) {
		if (result.status === 'rejected') {
			console.error(`notification failed for ${event}:`, result.reason);
		}
	}
};

export const contextFromUser = <const T extends object = {}>(
	user: {
		id: string;
		email?: string | null;
		fullName?: string | null;
		slug: string;
		avatar?: string | null;
	},
	extra?: T,
) => {
	const base: SharedContext = {
		userId: user.id,
		userEmail: user.email ?? '',
		userName: user.fullName ?? '',
		userSlug: user.slug ?? '',
		userAvatar: user.avatar,
	};
	if (!extra) return base as SharedContext & T;
	return { ...base, ...extra };
};
