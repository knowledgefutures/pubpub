import mailgun from 'mailgun.js';
import stripIndent from 'strip-indent';

import { env } from 'server/env';

const mg = mailgun.client({
	username: 'api',
	key: env.MAILGUN_API_KEY,
});

export const sendServicesInquiryEmail = ({ contactEmail, additionalDetails, selections }) => {
	return mg.messages.create('mg.pubpub.org', {
		from: 'PubPub Team <hello@mg.pubpub.org>',
		to: 'partnerships@pubpub.org',
		subject: 'Community Services Form Submission',
		text: stripIndent(`
			A Community Services inquiry was submitted:
			
			Contact Email: ${contactEmail},
			
			-----
			${selections}
			-----
			
			Additional Details: ${additionalDetails}
		
			Sincerely,
			PubPub Bot
		`),
		'h:Reply-To': 'hello@pubpub.org',
	});
};
