import type { ScopeSummary } from 'types';

export type MinimalScopeSummary = Omit<ScopeSummary, 'id' | 'createdAt' | 'updatedAt'>;

export const addScopeSummaries = (...summaries: MinimalScopeSummary[]): MinimalScopeSummary => {
	let discussions = 0;
	let reviews = 0;
	let pubs = 0;
	let collections = 0;
	let submissions = 0;
	summaries.forEach((summary) => {
		discussions += summary.discussions;
		reviews += summary.reviews;
		pubs += summary.pubs;
		collections += summary.collections;
		submissions += summary.submissions;
	});
	return { discussions, reviews, pubs, collections, submissions };
};

export const subtractScopeSummaries = (
	total: MinimalScopeSummary,
	subtract: MinimalScopeSummary,
): MinimalScopeSummary => {
	return {
		collections: total.collections - subtract.collections,
		pubs: total.pubs - subtract.pubs,
		discussions: total.discussions - subtract.discussions,
		reviews: total.reviews - subtract.reviews,
		submissions: total.submissions - subtract.submissions,
	};
};
