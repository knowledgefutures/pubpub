import mailgun from 'mailgun.js';
import stripIndent from 'strip-indent';

import { env } from 'server/env';

const mg = mailgun.client({
	username: 'api',
	key: env.MAILGUN_API_KEY,
});

export const sendSignupEmail = ({ toEmail, signupUrl }) => {
	return mg.messages.create('mg.pubpub.org', {
		from: 'PubPub Team <hello@mg.pubpub.org>',
		to: [toEmail],
		subject: 'Welcome to PubPub!',
		text: stripIndent(`
			Welcome to PubPub!

			Click the following link to create your account:

			${signupUrl}

			Sincerely,
			PubPub Support
		`),
		'h:Reply-To': 'hello@pubpub.org',
	});
};
