export type Scope = { communityId: string } & ({ pubId: string } | { collectionId: string } | {});

export type ScopeSummary = {
	collections: number;
	pubs: number;
	discussions: number;
	reviews: number;
};

export type UserScopeVisit = {
	id: string;
	communityId: string;
	updatedAt: string;
	collectionId: null | string;
	pubId: null | string;
	userId: string;
};
