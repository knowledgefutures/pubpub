import stripIndent from 'strip-indent';

import { sendEmail } from './reset';

const CC_DEV = ['dev@pubpub.org'];

export const sendSpamBanEmail = ({ toEmail, userName }: { toEmail: string; userName: string }) => {
	return sendEmail({
		to: [toEmail],
		cc: CC_DEV,
		subject: 'PubPub account restriction',
		text: stripIndent(`
			Hello${userName ? ` ${userName}` : ''},

			Your activity on PubPub has been flagged as spam. Your account has been restricted.

			If you believe this is an error, please contact us at hello@pubpub.org.

			Sincerely,
			PubPub Team
		`),
	});
};

export const sendSpamLiftedEmail = ({
	toEmail,
	userName,
}: {
	toEmail: string;
	userName: string;
}) => {
	return sendEmail({
		to: [toEmail],
		cc: CC_DEV,
		subject: 'PubPub account restriction lifted',
		text: stripIndent(`
			Hello${userName ? ` ${userName}` : ''},

			The restriction on your PubPub account has been lifted. You can log in and use the platform as usual.

			Sincerely,
			PubPub Team
		`),
	});
};
