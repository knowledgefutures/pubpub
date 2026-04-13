import stripIndent from 'strip-indent';

import { sendEmail } from './transport';

export const sendSignupEmail = ({ toEmail, signupUrl }) => {
	return sendEmail({
		to: [toEmail],
		subject: 'Welcome to PubPub!',
		text: stripIndent(`
			Welcome to PubPub!

			Click the following link to create your account:

			${signupUrl}

			Sincerely,
			PubPub Support
		`),
		replyTo: 'hello@pubpub.org',
	});
};
