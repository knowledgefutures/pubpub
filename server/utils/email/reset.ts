import mailgun from 'mailgun.js';
import stripIndent from 'strip-indent';

const mg = mailgun.client({
	username: 'api',
	key: process.env.MAILGUN_API_KEY!,
});

export const sendPasswordResetEmail = ({ toEmail, resetUrl }) => {
	// TODO: We should probably indicate the community somewhere.
	// e.g. 'We've received a request to reset your PubPub account on Responsive Science.'
	return mg.messages.create('mg.pubpub.org', {
		from: 'PubPub Team <hello@pubpub.org>',
		to: [toEmail],
		subject: 'Password Reset · PubPub',
		text: stripIndent(`
			We've received a password reset request. Follow the link below to reset your password.

			${resetUrl}

			Sincerely,
			PubPub Support
		`),
	});
};
