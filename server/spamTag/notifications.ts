import type { UserSpamTagFields } from 'types';

import {
	sendBanDevEmail,
	sendLiftDevEmail,
	sendNewSpamTagDevEmail,
	sendSpamBanEmail,
	sendSpamLiftedEmail,
} from 'server/utils/email';
import {
	postToSlackAboutNewUserSpamTag,
	postToSlackAboutSuspiciousUpload,
	postToSlackAboutUserBan,
	postToSlackAboutUserLifted,
} from 'server/utils/slack';

export type SpamEvent =
	| 'new-spam-tag'
	| 'suspicious-upload'
	| 'honeypot-ban'
	| 'manual-ban'
	| 'spam-lifted';

export type SpamNotificationContext = {
	userId: string;
	userEmail: string;
	userName: string;
	userSlug: string;
	userAvatar?: string | null;
	spamScore?: number | null;
	spamFields?: UserSpamTagFields;
	actorName?: string;
	uploadKey?: string;
	communityId?: string;
	sourceDiscussionId?: string | null;
};

type Handler = (ctx: SpamNotificationContext) => Promise<void>;

const handlers: Record<SpamEvent, Handler[]> = {
	'new-spam-tag': [
		(ctx) =>
			postToSlackAboutNewUserSpamTag({
				userId: ctx.userId,
				userName: ctx.userName,
				userSlug: ctx.userSlug,
				spamScore: ctx.spamScore ?? null,
			}),
		(ctx) => sendNewSpamTagDevEmail({ userEmail: ctx.userEmail, userName: ctx.userName }),
	],
	'suspicious-upload': [
		(ctx) =>
			postToSlackAboutSuspiciousUpload(
				ctx.userId,
				ctx.userEmail,
				ctx.userName,
				ctx.uploadKey!,
			),
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
		(ctx) => sendBanDevEmail({ userEmail: ctx.userEmail, userName: ctx.userName }),
	],
	'spam-lifted': [
		(ctx) =>
			postToSlackAboutUserLifted({
				userId: ctx.userId,
				userName: ctx.userName,
				userSlug: ctx.userSlug,
				actorName: ctx.actorName,
			}),
		(ctx) => sendSpamLiftedEmail({ toEmail: ctx.userEmail, userName: ctx.userName }),
		(ctx) => sendLiftDevEmail({ userEmail: ctx.userEmail, userName: ctx.userName }),
	],
};

export const notify = async (event: SpamEvent, ctx: SpamNotificationContext): Promise<void> => {
	const results = await Promise.allSettled(handlers[event].map((h) => h(ctx)));
	for (const result of results) {
		if (result.status === 'rejected') {
			console.error(`notification failed for ${event}:`, result.reason);
		}
	}
};

export const contextFromUser = (
	user: {
		id: string;
		email?: string | null;
		fullName?: string | null;
		slug: string;
		avatar?: string | null;
	},
	extra?: Partial<SpamNotificationContext>,
): SpamNotificationContext => ({
	userId: user.id,
	userEmail: user.email ?? '',
	userName: user.fullName ?? '',
	userSlug: user.slug ?? '',
	userAvatar: user.avatar,
	...extra,
});
