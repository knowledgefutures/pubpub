import * as types from 'types';

import { communitySpamPhrases } from './phrases';

type SpamField<T> = {
	extract: (value: T) => types.Maybe<string>;
	isProse: boolean;
	weight: number;
};

const CURRENT_SPAM_SCORE_VERSION = 1;

const communitySpamFields: Record<string, SpamField<types.Community>> = {
	title: {
		extract: (c) => c.title,
		isProse: true,
		weight: 1,
	},
	description: {
		extract: (c) => c.description,
		isProse: true,
		weight: 1,
	},
	subdomain: {
		extract: (c) => c.subdomain,
		isProse: false,
		weight: 1,
	},
	heroText: {
		extract: (c) => c.heroText,
		isProse: true,
		weight: 0.5,
	},
	heroTitle: {
		extract: (c) => c.heroTitle,
		isProse: true,
		weight: 0.5,
	},
	heroPrimaryButtonTitle: {
		extract: (c) => c.heroPrimaryButton?.title,
		isProse: true,
		weight: 0.2,
	},
	heroSecondaryButton: {
		extract: (c) => c.heroSecondaryButton?.title,
		isProse: true,
		weight: 0.2,
	},
	website: {
		extract: (c) => c.website,
		isProse: false,
		weight: 1,
	},
	email: {
		extract: (c) => c.email,
		isProse: false,
		weight: 0.1,
	},
};

const getMatchingSpamPhrases = (text: string, isProse: boolean): string[] => {
	if (text) {
		const matches = communitySpamPhrases.filter((phrase) => {
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
		return matches;
	}
	return [];
};

const getCommunitySpamScoreReport = (community: types.Community) => {
	return Object.keys(communitySpamFields).reduce(
		(report, key) => {
			const { extract, weight, isProse } = communitySpamFields[key];
			const text = extract(community);
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

export const getSuspectedCommunitySpamVerdict = (community: types.Community): types.SpamVerdict => {
	const { score, fields } = getCommunitySpamScoreReport(community);
	return {
		fields,
		spamScore: score,
		spamScoreVersion: CURRENT_SPAM_SCORE_VERSION,
		spamScoreComputedAt: new Date().toISOString(),
	};
};

export const isDangerousSpamScore = (score: number) => {
	return score >= 1;
};
