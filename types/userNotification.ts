import { ActivityAssociations, ActivityItem, ActivityItemOfKind } from './activity';
import { User } from './user';
import { UserSubscription } from './userSubscription';

export type UserNotification = {
	id: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	userSubscriptionId: string;
	activityItemId: string;
	isRead: boolean;
	manuallySetIsRead: boolean;
	user?: User;
	activityItem?: ActivityItem;
	userSubscription?: UserSubscription;
};

export type UserNotificationWithActivityItem = UserNotification & {
	activityItem: ActivityItemOfKind<'pub-discussion-comment-added' | 'pub-review-comment-added'>;
};

export type UserNotificationMarkReadTrigger = 'seen' | 'clicked-through' | 'manual';

export type UserNotificationPreferences = {
	id: string;
	createdAt: string;
	updatedAt: string;
	lastReceivedNotificationsAt: null | string;
	userId: string;
	receiveNotifications: boolean;
	subscribeToThreadsAsCommenter: boolean;
	subscribeToPubsAsMember: boolean;
	subscribeToPubsAsContributor: boolean;
	notificationCadence: number;
	markReadTrigger: UserNotificationMarkReadTrigger;
};

export type UserNotificationsFetchResult = {
	notifications: UserNotificationWithActivityItem[];
	associations: ActivityAssociations;
	subscriptions: UserSubscription[];
	notificationPreferences: UserNotificationPreferences;
};
