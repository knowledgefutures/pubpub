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
	| 'spam-status-updated-at';

export type SpamUserQueryOrdering = {
	direction: 'ASC' | 'DESC';
	field: SpamUserQueryOrderingField;
};

export type SpamUserQuery = {
	status: SpamStatus[];
	offset?: number;
	limit?: number;
	searchTerm?: string;
	ordering: SpamUserQueryOrdering;
};
