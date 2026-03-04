import stripIndent from 'strip-indent';

import { getSuperAdminTabUrl } from 'utils/superAdmin';

import { sendEmail } from './reset';

export const DEV_TEAM_EMAIL = 'dev@pubpub.org';

export const sendSpamBanEmail = ({ toEmail, userName }: { toEmail: string; userName: string }) => {
	return sendEmail({
		to: [toEmail],
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
		subject: 'PubPub account restriction lifted',
		text: stripIndent(`
			Hello${userName ? ` ${userName}` : ''},

			The restriction on your PubPub account has been lifted. You can log in and use the platform as usual.

			Sincerely,
			PubPub Team
		`),
	});
};

export const sendNewSpamTagDevEmail = ({
	userEmail,
	userName,
}: {
	userEmail: string;
	userName: string;
}) => {
	const reviewUrl = `https://pubpub.org${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userEmail)}`;
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `New spam tag: ${userName} (${userEmail})`,
		text: stripIndent(`
			A new spam tag has been created for ${userName} (${userEmail}).

			Review: ${reviewUrl}

			-- PubPub Spam System
		`),
	});
};

export const sendBanDevEmail = ({
	userEmail,
	userName,
}: {
	userEmail: string;
	userName: string;
}) => {
	const reviewUrl = `https://pubpub.org${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userEmail)}`;
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `User banned: ${userName} (${userEmail})`,
		text: stripIndent(`
			${userName} (${userEmail}) has been banned.

			Review: ${reviewUrl}

			-- PubPub Spam System
		`),
	});
};

export const sendLiftDevEmail = ({
	userEmail,
	userName,
}: {
	userEmail: string;
	userName: string;
}) => {
	const reviewUrl = `https://pubpub.org${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userEmail)}`;
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `Restriction lifted: ${userName} (${userEmail})`,
		text: stripIndent(`
			The restriction on ${userName} (${userEmail}) has been lifted.

			Review: ${reviewUrl}

			-- PubPub Spam System
		`),
	});
};
