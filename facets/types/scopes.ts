export type SingleScopeId = { communityId: string } | { collectionId: string } | { pubId: string };

export type BindingKey = 'communityId' | 'collectionId' | 'pubId';

export type ByScopeKind<T> = {
	community: T;
	collection: T;
	pub: T;
};

export type ScopeKind = keyof ByScopeKind<any>;
