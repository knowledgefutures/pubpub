import type { BanReason, UserSpamTagFields } from 'types';

import stripIndent from 'strip-indent';

import { sendEmail } from 'server/utils/email/reset';
import { getSuperAdminTabUrl } from 'utils/superAdmin';

import { buildReasonText, getSpamDashUrl } from './shared';

export const DEV_TEAM_EMAIL = 'dev@pubpub.org';

export const sendSpamBanEmail = ({ toEmail, userName }: { toEmail: string; userName: string }) => {
	return sendEmail({
		to: [toEmail],
		subject: 'PubPub account restriction',
		text: stripIndent(`
			Hello${userName ? ` ${userName}` : ''},

			Your activity on PubPub has been flagged as being in violation of our Acceptable Use Policy (https://www.pubpub.org/legal/aup). Your account has been banned. You are no longer able to log in and use the platform.

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
	reason,
}: {
	userEmail: string;
	userName: string;
	reason?: UserSpamTagFields;
}) => {
	const reviewUrl = `https://pubpub.org${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userEmail)}`;
	const reasonText = buildReasonText(reason);
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `New spam tag: ${userName} (${userEmail})`,
		text: stripIndent(`
			A new spam tag has been created for ${userName} (${userEmail}).

			${reasonText ? `Reason(s): ${reasonText}` : ''}

			Review: ${reviewUrl}

			-- PubPub Spam System
		`),
	});
};

export const sendBanDevEmail = ({
	userEmail,
	userName,
	actorName,
	reason,
}: {
	userEmail: string;
	userName: string;
	actorName?: string;
	reason?: UserSpamTagFields;
}) => {
	const reviewUrl = getSpamDashUrl(userName);
	const reasonText = buildReasonText(reason);
	const byText = actorName ? ` by ${actorName}` : '';
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `User banned: ${userName} (${userEmail})`,
		text: stripIndent(`
			${userName} (${userEmail}) has been banned${byText}.

			${reasonText ? `Reason(s): ${reasonText}` : ''}

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

export const sendCommunityFlagDevEmail = ({
	userName,
	userSlug,
	actorFullName,
	actorSlug,
	communitySubdomain,
	flagReason,
	flagReasonText,
}: {
	userName: string;
	userSlug: string;
	actorFullName: string;
	actorSlug: string;
	communitySubdomain: string;
	flagReason: BanReason;
	flagReasonText?: string | null;
}) => {
	const reviewUrl = `https://pubpub.org${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userName)}`;
	return sendEmail({
		to: [DEV_TEAM_EMAIL],
		subject: `Community flag: ${userName || 'Unknown'} flagged for ${flagReason}`,
		text: stripIndent(`
			A community admin (${actorFullName} (https://pubpub.org/user/${actorSlug})) has flagged ${userName} (https://pubpub.org/user/${userSlug}) for "${flagReason}" in community https://${communitySubdomain}.pubpub.org.

			${flagReasonText ? `Reason: ${flagReasonText}` : ''}

			Review: ${reviewUrl}

			-- PubPub Spam System
		`),
	});
};

export const sendCommunityFlagResolvedEmail = ({
	toEmail,
	actorName,
	userName,
	resolution,
}: {
	toEmail: string;
	actorName: string;
	userName: string;
	resolution: string;
}) => {
	return sendEmail({
		to: [toEmail],
		subject: `Update on your ban of ${userName} on PubPub`,
		text: stripIndent(`
			Hello${actorName ? ` ${actorName}` : ''},

			Thank you for flagging ${userName} in your community. We have reviewed the ban and the outcome is: ${resolution}.

			If you have further concerns, please contact us at hello@pubpub.org.

			Sincerely,
			PubPub Team
		`),
	});
};
