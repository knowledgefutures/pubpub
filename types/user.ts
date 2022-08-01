export type MinimalUser = {
	id: string;
	slug?: string;
	initials: string;
	fullName: string;
	firstName: string;
	lastName: string;
	avatar?: string;
	title?: string;
	orcid?: string;
	isShadowUser?: boolean;
	publicEmail?: string;
	feedback?: string;
};

export type User = MinimalUser & {
	bio: string;
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
