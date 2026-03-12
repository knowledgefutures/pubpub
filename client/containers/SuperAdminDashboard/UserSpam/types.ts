import type { SpamTag, SpamUserCommunityBan, UserWithPrivateFields } from 'types';

export type { RecentDiscussion } from 'types';

export type SpamUser = UserWithPrivateFields & {
	spamTag: SpamTag | null;
	affiliation?: { communitySubdomains: string[]; pubCount: number; discussionCount: number };
	communityBans?: SpamUserCommunityBan[];
};
