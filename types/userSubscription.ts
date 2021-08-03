import { UserSubscription } from 'server/models';

type UserSubscriptionAssociation = { pubId: string } | { threadId: string };

export type UserSubscription = {
	id: string;
	updatedAt: string;
	createdAt: string;
	userId: string;
	muted: boolean;
	createdAutomatically: boolean;
} & UserSubscriptionAssociation;

export type UniqueUserSubscriptionQuery =
	| Pick<UserSubscription, 'id'>
	| (Pick<UserSubscription, 'userId'> & UserSubscriptionAssociation);
