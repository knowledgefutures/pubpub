import type { SpamTag, User } from 'server/models';
import type * as types from 'types';

import { communitySpamPhrases } from './phrases';

type SpamField<T> = {
	extract: (value: T) => types.Maybe<string>;
	isProse: boolean;
	weight: number;
};

const CURRENT_SPAM_SCORE_VERSION = 1;

const userSpamFields: Record<string, SpamField<User>> = {
	fullName: {
		extract: (u) => u.fullName,
		isProse: true,
		weight: 1,
	},
	title: {
		extract: (u) => u.title,
		isProse: true,
		weight: 1,
	},
	bio: {
		extract: (u) => u.bio,
		isProse: true,
		weight: 1,
	},
};

const getMatchingSpamPhrases = (text: string, isProse: boolean): string[] => {
	if (text) {
		return communitySpamPhrases.filter((phrase) => {
			const lowercaseText = text.toLowerCase();
			const lowercasePhrase = phrase.toLowerCase();
			if (isProse) {
				return (
					lowercaseText.includes(' ' + lowercasePhrase) ||
					lowercaseText.includes(lowercasePhrase + ' ')
				);
			}
			return lowercaseText.includes(lowercasePhrase);
		});
	}
	return [];
};

const getUserSpamScoreReport = (user: User) => {
	return Object.keys(userSpamFields).reduce(
		(report, key) => {
			const { extract, weight, isProse } = userSpamFields[key];
			const text = extract(user);
			if (text) {
				const matchingPhrases = getMatchingSpamPhrases(text, isProse);
				if (matchingPhrases.length) {
					return {
						score: report.score + weight * matchingPhrases.length,
						fields: { ...report.fields, [key]: matchingPhrases },
					};
				}
			}
			return report;
		},
		{ score: 0, fields: {} as Record<string, string[]> },
	);
};

export const getSuspectedUserSpamVerdict = (user: User): types.SpamVerdict<SpamTag> => {
	const { score, fields } = getUserSpamScoreReport(user);
	return {
		fields,
		spamScore: score,
		spamScoreVersion: CURRENT_SPAM_SCORE_VERSION,
		spamScoreComputedAt: new Date(),
	};
};
