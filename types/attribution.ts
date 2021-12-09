export type AttributableUser = {
	id: string;
	slug: string;
	initials: string;
	fullName: string;
	firstName: string;
	lastName: string;
	avatar: string;
	title: string;
	orcid: string;
	isShadowUser?: boolean;
};

export type User = AttributableUser & {
	slug: string;
	bio: string;
	publicEmail: string;
	location: string;
	website: string;
	facebook: string;
	twitter: string;
	github: string;
	googleScholar: string;
	passwordDigest: string;
	hash: string;
	salt: string;
	email: string;
	resetHash: string;
	resetHashExpiration: number;
};

export type PubAttribution = {
	id: string;
	name: string;
	avatar?: string;
	title?: string;
	order: number;
	isAuthor?: boolean;
	roles?: string[];
	affiliation?: string;
	orcid?: string;
	userId?: string;
	user?: AttributableUser;
	createdAt: string;
};

export type CollectionAttribution = {
	id: string;
	name: string;
	avatar?: string;
	title?: string;
	order: number;
	isAuthor?: boolean;
	roles?: string[];
	affiliation?: string;
	orcid?: string;
	userId?: string;
	user?: AttributableUser;
	createdAt: string;
};

export type Attribution = CollectionAttribution | PubAttribution;
export type AttributionWithUser = Attribution & { user: AttributableUser | User };

export const isAttributionWithUser = (
	attribution: Attribution,
): attribution is AttributionWithUser => 'user' in attribution && !!attribution.user;
