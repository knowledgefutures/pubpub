import { ScopeSummary } from 'types';

export const addScopeSummaries = (...summaries: ScopeSummary[]): ScopeSummary => {
	let discussions = 0;
	let reviews = 0;
	let pubs = 0;
	let collections = 0;
	summaries.forEach((summary) => {
		discussions += summary.discussions;
		reviews += summary.reviews;
		pubs += summary.pubs;
		collections += summary.collections;
	});
	return { discussions, reviews, pubs, collections };
};

export const subtractScopeSummaries = (total: ScopeSummary, subtract: ScopeSummary) => {
	return {
		collections: total.collections - subtract.collections,
		pubs: total.pubs - subtract.pubs,
		discussions: total.discussions - subtract.discussions,
		reviews: total.reviews - subtract.reviews,
	};
};
