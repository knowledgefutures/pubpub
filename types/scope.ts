export type ScopeId = { communityId: string } & ({ pubId: string } | { collectionId: string } | {});

export type SingleScopeId = { communityId: string } | { pubId: string } | { collectionId: string };

export type ScopeSummary = {
	collections: number;
	pubs: number;
	discussions: number;
	reviews: number;
	submissions: number;
};

export type UserScopeVisit = {
	id: string;
	communityId: string;
	updatedAt: string;
	collectionId: null | string;
	pubId: null | string;
	userId: string;
};
