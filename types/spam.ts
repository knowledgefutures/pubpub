export type SpamStatus = 'unreviewed' | 'confirmed-spam' | 'confirmed-not-spam';

export type SpamTag = {
	id: string;
	spamScore: number;
	spamScoreVersion: number;
	spamScoreComputedAt: string;
	status: SpamStatus;
	statusUpdatedAt: null | string;
	fields: Record<string, string[]>;
};

export type SpamVerdict = Pick<
	SpamTag,
	'spamScore' | 'spamScoreVersion' | 'spamScoreComputedAt' | 'fields'
>;
