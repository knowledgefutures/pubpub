import type { BanReason, UserSpamTagFields } from 'types';

import { postToSlack } from 'server/utils/slack';

import {
	buildHoneypotContextLine,
	buildReasonText,
	getSpamDashUrl,
	getUserProfileUrl,
} from './shared';

type SuspiciousUploadSlackOptions = {
	userName: string;
	uploadKey: string;
};

export const postToSlackAboutSuspiciousUpload = async (opts: SuspiciousUploadSlackOptions) => {
	if (process.env.NODE_ENV === 'test') return;
	const { userName, uploadKey } = opts;
	const dashUrl = getSpamDashUrl(userName);
	await postToSlack({
		icon_emoji: ':warning:',
		attachments: [
			{
				fallback: `Suspicious upload by ${userName}: ${uploadKey}`,
				pretext: 'Suspicious upload detected (scam keywords in filename)',
				color: 'warning',
				fields: [
					{ title: 'User', value: userName },
					{ title: 'Object key', value: uploadKey },
				],
				actions: [
					{
						type: 'button',
						text: 'View in Spam Users Dashboard',
						url: dashUrl,
					},
				],
			},
		],
	});
};

type UserBanSlackOptions = {
	userId: string;
	userName: string;
	userSlug: string;
	userAvatar?: string | null;
	reason?: UserSpamTagFields;
	actorName?: string;
};

export const postToSlackAboutUserBan = async (opts: UserBanSlackOptions) => {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	const { userName, userSlug, userAvatar, reason, actorName } = opts;
	const profileUrl = getUserProfileUrl(userSlug);
	const dashUrl = getSpamDashUrl(userName);
	const reasonText = buildReasonText(reason);
	const byText = actorName ? ` by ${actorName}` : '';
	const reasonSuffix = reasonText ? ` -- ${reasonText}` : '';
	const headline = `*<${profileUrl}|${userName}>* banned${byText}${reasonSuffix}`;
	const fallback = `${userName} banned${byText}${reasonSuffix}`;

	const headerSection: Record<string, any> = {
		type: 'section',
		text: { type: 'mrkdwn', text: headline },
	};
	if (userAvatar) {
		headerSection.accessory = {
			type: 'image',
			image_url: userAvatar,
			alt_text: userName,
		};
	}

	const blocks: Record<string, any>[] = [headerSection];

	const honeypotLine = buildHoneypotContextLine(reason);
	if (honeypotLine) {
		blocks.push({
			type: 'context',
			elements: [{ type: 'mrkdwn', text: honeypotLine }],
		});
	}

	blocks.push({
		type: 'actions',
		elements: [
			{ type: 'button', text: { type: 'plain_text', text: 'Profile' }, url: profileUrl },
			{ type: 'button', text: { type: 'plain_text', text: 'Spam Dashboard' }, url: dashUrl },
		],
	});

	await postToSlack({
		icon_emoji: ':no_entry:',
		text: fallback,
		attachments: [{ fallback, color: 'danger', blocks }],
	});
};

type UserLiftedSlackOptions = {
	userId: string;
	userName: string;
	userSlug: string;
	actorName?: string;
};

export const postToSlackAboutUserLifted = async (opts: UserLiftedSlackOptions) => {
	if (process.env.NODE_ENV === 'test') return;
	const { userName, userSlug, actorName } = opts;
	const profileUrl = getUserProfileUrl(userSlug);
	const byText = actorName ? ` by ${actorName}` : '';
	const headline = `*<${profileUrl}|${userName}>* restriction lifted${byText}`;
	const fallback = `${userName} restriction lifted${byText}`;
	await postToSlack({
		icon_emoji: ':white_check_mark:',
		text: fallback,
		attachments: [
			{
				fallback,
				color: '#5cb85c',
				blocks: [
					{ type: 'section', text: { type: 'mrkdwn', text: headline } },
					{
						type: 'actions',
						elements: [
							{
								type: 'button',
								text: { type: 'plain_text', text: 'Profile' },
								url: profileUrl,
							},
						],
					},
				],
			},
		],
	});
};

type NewSpamTagSlackOptions = {
	userId: string;
	userName: string;
	userSlug: string;
	spamScore: number | null;
};

export const postToSlackAboutNewUserSpamTag = async (opts: NewSpamTagSlackOptions) => {
	if (process.env.NODE_ENV === 'test') return;
	const { userName, userSlug, spamScore } = opts;
	const profileUrl = getUserProfileUrl(userSlug);
	const dashUrl = getSpamDashUrl(userName);
	const scorePart = spamScore != null ? ` (score: ${spamScore})` : '';
	const headline = `New spam tag for *<${profileUrl}|${userName}>*${scorePart}`;
	const fallback = `New spam tag: ${userName}${scorePart}`;
	await postToSlack({
		icon_emoji: ':mag:',
		text: fallback,
		attachments: [
			{
				fallback,
				color: '#f0ad4e',
				blocks: [
					{ type: 'section', text: { type: 'mrkdwn', text: headline } },
					{
						type: 'actions',
						elements: [
							{
								type: 'button',
								text: { type: 'plain_text', text: 'Profile' },
								url: profileUrl,
							},
							{
								type: 'button',
								text: { type: 'plain_text', text: 'Review in Dashboard' },
								url: dashUrl,
							},
						],
					},
				],
			},
		],
	});
};

type CommunityFlagSlackOptions = {
	userName: string;
	userSlug: string;
	actorName: string;
	communitySubdomain: string;
	reason: BanReason;
	reasonText?: string | null;
};

export const postToSlackAboutCommunityFlag = async (opts: CommunityFlagSlackOptions) => {
	if (process.env.NODE_ENV === 'test') return;
	const { userName, userSlug, actorName, communitySubdomain, reason, reasonText } = opts;
	const profileUrl = getUserProfileUrl(userSlug);
	const dashUrl = getSpamDashUrl(userName);

	const reasonLabel = reason.replace(/-/g, ' ');
	const extraReason = reasonText ? `: ${reasonText}` : '';

	const headline =
		`*<${profileUrl}|${userName}>* banned by ${actorName} in *${communitySubdomain}*` +
		`\nReason: ${reasonLabel}${extraReason}`;
	const fallback = `${userName} banned by ${actorName} in ${communitySubdomain} for ${reasonLabel}`;

	await postToSlack({
		icon_emoji: ':triangular_flag_on_post:',
		text: fallback,
		attachments: [
			{
				fallback,
				color: '#e67e22',
				blocks: [
					{ type: 'section', text: { type: 'mrkdwn', text: headline } },
					{
						type: 'actions',
						elements: [
							{
								type: 'button',
								text: { type: 'plain_text', text: 'User Profile' },
								url: profileUrl,
							},
							{
								type: 'button',
								text: { type: 'plain_text', text: 'Spam Dashboard' },
								url: dashUrl,
							},
						],
					},
				],
			},
		],
	});
};

export const postToSlackAboutCommunityFlagRetracted = async (opts: CommunityFlagSlackOptions) => {
	if (process.env.NODE_ENV === 'test') return;
	const { userName, userSlug, actorName, communitySubdomain, reason, reasonText } = opts;
	const profileUrl = getUserProfileUrl(userSlug);
	const dashUrl = getSpamDashUrl(userName);

	const reasonLabel = reason.replace(/-/g, ' ');
	const extraReason = reasonText ? `: ${reasonText}` : '';

	const headline =
		`*<${profileUrl}|${userName}>* ban retracted by ${actorName} in *${communitySubdomain}*` +
		`\nOriginal reason: ${reasonLabel}${extraReason}`;
	const fallback = `${userName} ban retracted by ${actorName} in ${communitySubdomain}`;

	await postToSlack({
		icon_emoji: ':triangular_flag_on_post:',
		text: fallback,
		attachments: [
			{
				fallback,
				color: '#95a5a6',
				blocks: [
					{ type: 'section', text: { type: 'mrkdwn', text: headline } },
					{
						type: 'actions',
						elements: [
							{
								type: 'button',
								text: { type: 'plain_text', text: 'User Profile' },
								url: profileUrl,
							},
							{
								type: 'button',
								text: { type: 'plain_text', text: 'Spam Dashboard' },
								url: dashUrl,
							},
						],
					},
				],
			},
		],
	});
};
