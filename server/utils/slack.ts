import fetch from 'node-fetch';

import { isProd } from 'utils/environment';

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

export const postToSlackAboutNewCommunity = async (
	title: string,
	subdomain: string,
	adminName: string,
	adminEmail: string,
) => {
	if (isProd()) {
		const url = `https://${subdomain}.pubpub.org`;
		await postToSlack({
			icon_emoji: ':bowtie:',
			attachments: [
				{
					fallback: `*${title}*\n<${url}>\n_${adminName} (${adminEmail})_`,
					pretext: 'New community created!',
					color: 'good',
					fields: [
						{
							title: `${title}`,
							value: `${url}\n_${adminName} (${adminEmail})_`,
						},
					],
				},
			],
		});
	}
};
