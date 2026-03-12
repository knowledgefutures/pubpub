import type { BanReason } from 'types';

export const moderationReasonLabels: Record<BanReason, string> = {
	'spam-content': 'Spam',
	'hateful-language': 'Hateful language',
	harassment: 'Harassment',
	impersonation: 'Impersonation',
	other: 'Other',
};

export const getReasonLabel = (reason: BanReason): string =>
	moderationReasonLabels[reason] ?? reason;
