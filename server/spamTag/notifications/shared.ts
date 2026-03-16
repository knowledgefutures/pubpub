import type { UserSpamTagFields } from 'types/spam';

import { getSuperAdminTabUrl } from 'utils/superAdmin';

const DEFAULT_NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES = 10;

export const getUserProfileUrl = (userSlug: string) => `https://www.pubpub.org/user/${userSlug}`;

export const getSpamDashUrl = (userName: string) =>
	`https://pubpub.org${getSuperAdminTabUrl('spamUsers')}?q=${encodeURIComponent(userName)}`;

export const buildReasonText = (reason?: UserSpamTagFields): string => {
	if (!reason) {
		return '';
	}

	if (reason.manuallyMarkedBy?.length) {
		const last = reason.manuallyMarkedBy[reason.manuallyMarkedBy.length - 1];

		return `Manually marked by ${last.userName}`;
	}

	if (reason.newAccountLinkCommentTriggers?.length) {
		const last =
			reason.newAccountLinkCommentTriggers[reason.newAccountLinkCommentTriggers.length - 1];

		const sourceText =
			last.source === 'discussion' ? 'discussion starter comment' : 'thread comment';

		const accountAgeMinutes =
			typeof last.accountAgeMinutes === 'number'
				? last.accountAgeMinutes
				: DEFAULT_NEW_ACCOUNT_LINK_COMMENT_WINDOW_MINUTES;

		return `Posted a link in a ${sourceText} within ${accountAgeMinutes} minutes of signup`;
	}

	if (reason.suspiciousFiles?.length) {
		return 'Uploading suspicious files';
	}

	if (reason.suspiciousComments?.length) {
		return 'Posting suspicious comments';
	}

	if (reason.honeypotTriggers?.length) {
		const last = reason.honeypotTriggers[reason.honeypotTriggers.length - 1];
		const parts: string[] = [last.honeypot];

		if (last.context?.communitySubdomain) {
			parts.push(`community: ${last.context.communitySubdomain}`);
		}

		if (last.context?.pubSlug) {
			parts.push(`pub: ${last.context.pubSlug}`);
		}

		return `Honeypot triggered (${parts.join(', ')})`;
	}

	return '';
};

export const buildHoneypotContextLine = (reason?: UserSpamTagFields): string | null => {
	if (!reason?.honeypotTriggers?.length) {
		return null;
	}

	const last = reason.honeypotTriggers[reason.honeypotTriggers.length - 1];
	if (!last.context) {
		return null;
	}

	const parts: string[] = [];

	if (last.context.communitySubdomain) {
		const communityUrl = `https://${last.context.communitySubdomain}.pubpub.org`;

		parts.push(`Community: <${communityUrl}|${last.context.communitySubdomain}>`);
	}

	if (last.context.pubSlug && last.context.communitySubdomain) {
		const pubUrl = `https://${last.context.communitySubdomain}.pubpub.org/pub/${last.context.pubSlug}`;

		parts.push(`Pub: <${pubUrl}|${last.context.pubSlug}>`);
	} else if (last.context.pubSlug) {
		parts.push(`Pub: ${last.context.pubSlug}`);
	}

	if (last.context.content) {
		const truncated =
			last.context.content.length > 200
				? last.context.content.slice(0, 200) + '...'
				: last.context.content;

		parts.push(`Content: ${truncated}`);
	}

	if (parts.length > 0) {
		return parts.join('  |  ');
	}

	return null;
};
