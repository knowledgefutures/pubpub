import stripIndent from 'strip-indent';

import { sendEmail, transporter } from './transport';

export { sendEmail, transporter };

export const sendPasswordResetEmail = ({ toEmail, resetUrl }) => {
	// TODO: We should probably indicate the community somewhere.
	// e.g. 'We've received a request to reset your PubPub account on Responsive Science.'
	return sendEmail({
		to: [toEmail],
		subject: 'Password Reset · PubPub',
		text: stripIndent(`
			We've received a password reset request. Follow the link below to reset your password.

			${resetUrl}

			Sincerely,
			PubPub Support
		`),
		replyTo: 'hello@pubpub.org',
	});
};

export const sendEmailChangeEmail = ({ toEmail, changeUrl }) => {
	return sendEmail({
		to: [toEmail],
		subject: 'Confirm Email Change · PubPub',
		text: stripIndent(`
			We've received a request to change your email address to this email. Follow the link below to confirm this change.

			${changeUrl}

			If you did not request this change, please ignore this email.

			Sincerely,
			PubPub Support
		`),
		replyTo: 'hello@pubpub.org',
	});
};
