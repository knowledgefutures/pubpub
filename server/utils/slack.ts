import type { SpamStatus } from 'types';

import fetch from 'node-fetch';

import { isDangerousSpamScore } from 'server/spamTag/score';
import { isProd } from 'utils/environment';
import { getSuperAdminTabUrl } from 'utils/superAdmin';

const defaultBody = { username: 'PubPub', unfurl_links: true };

export const postToSlack = async (body: Record<string, any>) => {
	const slackUrl = process.env.SLACK_WEBHOOK_URL!;
	if (slackUrl) {
		try {
			const res = await fetch(slackUrl, {
				method: 'POST',
				body: JSON.stringify({ ...defaultBody, ...body }),
			});
			if (res.status < 200 || res.status > 299) {
				const bodyText = await res.text();
				throw new Error(`Got response ${res.status} ${bodyText}`);
			}
		} catch (err) {
			console.error('Failed to post to Slack.', err);
		}
	}
};

type NewCommunitySlackOptions = {
	title: string;
	subdomain: string;
	adminName: string;
	adminEmail: string;
	spamScore: undefined | null | number;
	description?: string | null;
	heroLogo?: string | null;
	accentColorDark?: string | null;
};

const buildNewCommunityBlocks = (
	opts: NewCommunitySlackOptions & { url: string; spamDashUrl: string },
) => {
	const { title, url, adminName, adminEmail, spamScore, description, heroLogo, spamDashUrl } =
		opts;
	const isDangerous = typeof spamScore === 'number' && isDangerousSpamScore(spamScore);

	const blocks: Record<string, any>[] = [];

	const headerSection: Record<string, any> = {
		type: 'section',
		text: {
			type: 'mrkdwn',
			text: `*<${url}|${title}>*\n${url}`,
		},
	};
	if (heroLogo) {
		headerSection.accessory = {
			type: 'image',
			image_url: heroLogo,
			alt_text: title,
		};
	}
	blocks.push(headerSection);

	if (description) {
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `> ${description}`,
			},
		});
	}

	const spamScorePart = typeof spamScore === 'number' ? `  |  Spam score: *${spamScore}*` : '';

	blocks.push({
		type: 'context',
		elements: [
			{
				type: 'mrkdwn',
				text: `Created by *${adminName}* (${adminEmail})${spamScorePart}`,
			},
		],
	});

	blocks.push({
		type: 'actions',
		elements: [
			{
				type: 'button',
				text: {
					type: 'plain_text',
					text: isDangerous ? 'Review Community' : 'Approve Community',
				},
				url: spamDashUrl,
				...(isDangerous ? { style: 'danger' } : {}),
			},
			{
				type: 'button',
				text: { type: 'plain_text', text: 'Visit Community' },
				url,
			},
		],
	});

	return blocks;
};

type CommunityStatusSlackOptions = {
	title: string;
	subdomain: string;
	status: SpamStatus;
};

export const postToSlackAboutCommunityStatusChange = async (opts: CommunityStatusSlackOptions) => {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	const { title, subdomain, status } = opts;
	const baseUrl = isProd() ? 'pubpub.org' : 'duqduq.org';
	const url = `https://${subdomain}.${baseUrl}`;
	const spamDashUrl = `https://${baseUrl}${getSuperAdminTabUrl('spam')}?q=${subdomain}`;

	const emoji = status === 'confirmed-not-spam' ? ':white_check_mark:' : ':no_entry:';
	const verb = status === 'confirmed-not-spam' ? 'approved' : 'rejected';
	const color = status === 'confirmed-not-spam' ? '#5cb85c' : '#d9534f';
	const notificationText = `Community ${verb}: ${title}`;

	await postToSlack({
		icon_emoji: emoji,
		text: notificationText,
		attachments: [
			{
				color,
				fallback: notificationText,
				blocks: [
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `*<${url}|${title}>* has been *${verb}*`,
						},
					},
					{
						type: 'actions',
						elements: [
							{
								type: 'button',
								text: { type: 'plain_text', text: 'Spam Dashboard' },
								url: spamDashUrl,
							},
							{
								type: 'button',
								text: { type: 'plain_text', text: 'Visit Community' },
								url,
							},
						],
					},
				],
			},
		],
	});
};

export const postToSlackAboutNewCommunity = async (opts: NewCommunitySlackOptions) => {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	const { title, subdomain, adminName, adminEmail, spamScore, accentColorDark } = opts;
	const baseUrl = isProd() ? 'pubpub.org' : 'duqduq.org';
	const url = `https://${subdomain}.${baseUrl}`;
	const spamDashUrl = `https://${baseUrl}${getSuperAdminTabUrl('spam')}?q=${subdomain}`;
	const isDangerous = typeof spamScore === 'number' && isDangerousSpamScore(spamScore);

	const envSuffix = isProd() ? '' : ' _(dev, ignore)_';
	// top-level text is what shows in phone/desktop notifications
	const notificationText = `New Community: ${title} by ${adminName} (${adminEmail})${envSuffix}`;

	const sidebarColor = isDangerous ? '#d9534f' : accentColorDark || '#2D2E2F';

	await postToSlack({
		icon_emoji: ':bowtie:',
		text: notificationText,
		attachments: [
			{
				color: sidebarColor,
				fallback: notificationText,
				blocks: buildNewCommunityBlocks({ ...opts, url, spamDashUrl }),
			},
		],
	});
};

export const postToSlackAboutSuspiciousUpload = async (
	userId: string,
	userEmail: string,
	userName: string,
	key: string,
) => {
	if (isProd()) {
		const spamUsersUrl = `https://pubpub.org${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userEmail)}`;
		await postToSlack({
			icon_emoji: ':warning:',
			attachments: [
				{
					fallback: `Suspicious upload by ${userName} (${userEmail}): ${key}`,
					pretext: 'Suspicious upload detected (scam keywords in filename)',
					color: 'warning',
					fields: [
						{ title: 'User', value: `${userName} (${userEmail})` },
						{ title: 'Object key', value: key },
					],
					actions: [
						{
							type: 'button',
							text: 'View in Spam Users Dashboard',
							url: spamUsersUrl,
						},
					],
				},
			],
		});
	}
};
