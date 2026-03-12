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
	| 'discussion-count'
	| 'last-activity'
	| 'activity-count';

export type SpamUserQueryOrdering = {
	direction: 'ASC' | 'DESC';
	field: SpamUserQueryOrderingField;
};

export type SpamUserAffiliation = {
	communitySubdomains: string[];
	pubCount: number;
	discussionCount: number;
};

export type SpamUserCommunityBan = {
	id: string;
	communitySubdomain: string;
	communityTitle: string | null;
	reason: string;
	reasonText: string | null;
	status: string;
	createdAt: string;
	actorName: string | null;
	actorSlug: string | null;
	sourceCommentText: string | null;
	sourceCommentPubSlug: string | null;
	sourceCommentPubTitle: string | null;
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
	createdAfter?: string;
	createdBefore?: string;
	activeAfter?: string;
	activeBefore?: string;
	minActivities?: number;
	maxActivities?: number;
	hasCommunityBan?: boolean;
	spamFieldsFilter?: SpamFieldsFilterKey[];
};

export type SpamFieldsFilterKey =
	| 'honeypotTriggers'
	| 'suspiciousFiles'
	| 'suspiciousComments'
	| 'manuallyMarkedBy';

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

export type BanReason =
	| 'spam-content'
	| 'hateful-language'
	| 'harassment'
	| 'impersonation'
	| 'other';

/** @deprecated use BanReason */
export type UserCommunityFlagReason = BanReason;

export type BanStatus = 'active' | 'retracted';

/** @deprecated use BanStatus */
export type UserCommunityFlagStatus = BanStatus;

export type SerializedCommunityBan = {
	id: string;
	userId: string;
	communityId: string;
	actorId: string;
	reason: BanReason;
	reasonText: string | null;
	sourceThreadCommentId: string | null;
	spamTagId: string | null;
	status: BanStatus;
	createdAt: string;
	updatedAt: string;
	user?: { fullName: string; slug: string; email?: string };
	actor?: { fullName: string; slug: string };
	community?: { subdomain: string };
};

/** @deprecated use SerializedCommunityBan */
export type SerializedUserCommunityFlag = SerializedCommunityBan;

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
