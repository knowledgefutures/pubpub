import type { SpamTag as SpamTagModel } from 'server/models';

import type { SerializedModel } from './serializedModel';

export type SpamStatus = 'unreviewed' | 'confirmed-spam' | 'confirmed-not-spam';

export type SpamTag = SerializedModel<SpamTagModel>;

export type SpamVerdict<T extends SpamTag | SpamTagModel = SpamTag> = Pick<
	T,
	'spamScore' | 'spamScoreVersion' | 'spamScoreComputedAt' | 'fields'
>;

export type SpamCommunityQueryOrderingField =
	| 'community-created-at'
	| 'spam-score'
	| 'spam-status-updated-at';

export type SpamCommunityQueryOrdering = {
	direction: 'ASC' | 'DESC';
	field: SpamCommunityQueryOrderingField;
};

export type SpamCommunityQuery = {
	status: SpamStatus[];
	offset?: number;
	limit?: number;
	searchTerm?: string;
	ordering: SpamCommunityQueryOrdering;
};

export type SpamUserQueryOrderingField =
	| 'user-created-at'
	| 'spam-score'
	| 'spam-status-updated-at'
	| 'discussion-count';

export type SpamUserQueryOrdering = {
	direction: 'ASC' | 'DESC';
	field: SpamUserQueryOrderingField;
};

export type SpamUserAffiliation = {
	communitySubdomains: string[];
	pubCount: number;
	discussionCount: number;
};

export type SpamUserQuery = {
	status?: SpamStatus[] | null;
	offset?: number;
	limit?: number;
	searchTerm?: string;
	ordering: SpamUserQueryOrdering;
	includeAffiliation?: boolean;
	spamTagPresence?: 'any' | 'present' | 'absent';
	communitySubdomain?: string;
};

export type RecentDiscussion = {
	id: string;
	title: string | null;
	createdAt: string;
	pubTitle: string | null;
	pubSlug: string | null;
	communitySubdomain: string | null;
	firstCommentText: string | null;
};

export type HoneypotTrigger =
	| 'create-community'
	| 'create-pub'
	| 'create-user'
	| 'edit-user'
	| 'create-discussion'
	| 'create-thread-comment';

export type HoneypotContext = {
	communityId?: string;
	communitySubdomain?: string;
	pubId?: string;
	pubSlug?: string;
	content?: string;
};

export type UserSpamTagFields = {
	suspiciousFiles?: string[];
	suspiciousComments?: string[];
	honeypotTriggers?: {
		honeypot: HoneypotTrigger;
		value: string;
		context?: HoneypotContext;
		triggeredAt?: string;
	}[];
	manuallyMarkedBy?: {
		userId: string;
		userName: string;
		at: string;
	}[];
};
