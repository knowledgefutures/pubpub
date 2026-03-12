import type { BanReason } from '../spam';
import type { InsertableActivityItemBase } from './base';

type CommunityBanActivityItemBase = InsertableActivityItemBase & {
	payload: {
		userId: string;
		community: {
			title: string;
		};
		reason?: BanReason | null;
		sourceThreadCommentId?: string | null;
		sourcePubId?: string | null;
		sourcePubTitle?: string | null;
	};
};

export type CommunityBanCreatedActivityItem = CommunityBanActivityItemBase & {
	kind: 'community-ban-created';
};

export type CommunityBanRetractedActivityItem = CommunityBanActivityItemBase & {
	kind: 'community-ban-retracted';
};

export type CommunityBanActivityItem =
	| CommunityBanCreatedActivityItem
	| CommunityBanRetractedActivityItem;
