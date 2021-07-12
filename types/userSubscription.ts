import { UserSubscription } from 'server/models';

export type UserSubscriptionTarget = { pubId: string } | { threadId: string };

export type UserSubscriptionStatus =
	// Muted: user will never receive notifications about the associated item
	// unless superseded by a more specific subscription
	// (e.g. a Thread subscription superseding a Pub subscription)
	| 'muted'
	// Inactive: this subscription will not actively generate notifications, but it will also not
	// prevent other subscriptions from producing them.
	| 'inactive'
	// Active: this subscription will actively generate notifications for this item
	| 'active';

export type UserSubscription = {
	id: string;
	updatedAt: string;
	createdAt: string;
	userId: string;
	status: UserSubscriptionStatus;
	setAutomatically: boolean;
	pubId: null | string;
	threadId: null | string;
};

export type UniqueUserSubscriptionQuery =
	| Pick<UserSubscription, 'id'>
	| (Pick<UserSubscription, 'userId'> & UserSubscriptionTarget);
