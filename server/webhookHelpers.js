/* eslint-disable import/prefer-default-export */
import request from 'request-promise';

const base = 'https://hooks.slack.com/services/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';

export const alertNewCommunity = (communityName, communitySubdomain, adminName, adminEmail) => {
	const options = {
		method: 'POST',
		uri: `${base}`,
		body: {
			username: 'PubPub',
			icon_emoji: ':bowtie:',
			attachments: [
				{
					fallback: `*${communityName}*\n<https://${communitySubdomain}.pubpub.org>\n_${adminName} (${adminEmail})_`,
					pretext: 'New community created!',
					color: 'good',
					fields: [
						{
							title: `${communityName}`,
							value: `https://${communitySubdomain}.pubpub.org\n_${adminName} (${adminEmail})_`,
						},
					],
				},
			],
			unfurl_links: true,
		},
		json: true,
	};
	return request(options)
		.then()
		.catch((err) => {
			console.warn(err);
		});
};
