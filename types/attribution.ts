import { MinimalUser, User } from './user';

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
	user?: MinimalUser;
	createdAt: string;
	pubId: string;
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
	user?: MinimalUser;
	createdAt: string;
	collectionId: string;
};

export type Attribution = CollectionAttribution | PubAttribution;
export type AttributionWithUser = Attribution & { user: MinimalUser | User };

export const isAttributionWithUser = (
	attribution: Attribution,
): attribution is AttributionWithUser => 'user' in attribution && !!attribution.user;

export const isCollectionAttribution = (
	attribution: Attribution,
): attribution is CollectionAttribution => 'collectionId' in attribution;

export const isPubAttribution = (attribution: Attribution): attribution is PubAttribution =>
	'pubId' in attribution;
