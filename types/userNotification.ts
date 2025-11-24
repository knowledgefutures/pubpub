import type { CascadedFacetsForScopes } from 'facets';
import type {
	ActivityItem,
	UserNotification as UserNotificationModel,
	UserNotificationPreferences as UserNotificationPreferencesModel,
	UserSubscription as UserSubscriptionModel,
} from 'server/models';

import type {
	ActivityAssociations,
	ActivityItemOfKind,
	PubDiscussionCommentAddedActivityItem,
	PubReviewCommentAddedActivityItem,
} from './activity';
import type { SerializedModel } from './serializedModel';
import type { UserSubscription } from './userSubscription';

export type UserNotification = SerializedModel<UserNotificationModel>;

export type UserNotificationWithActivityItemModel = UserNotificationModel & {
	activityItem:
		| ActivityItem<PubDiscussionCommentAddedActivityItem>
		| ActivityItem<PubReviewCommentAddedActivityItem>;
};

export type UserNotificationWithActivityItem = Omit<UserNotification, 'activityItem'> & {
	activityItem:
		| ActivityItemOfKind<'pub-discussion-comment-added'>
		| ActivityItemOfKind<'pub-review-comment-added'>;
};

export type UserNotificationMarkReadTrigger = 'seen' | 'clicked-through' | 'manual';

export type UserNotificationPreferences = SerializedModel<UserNotificationPreferencesModel>;

export type UserNotificationsFetchResult = {
	notifications: UserNotificationWithActivityItem[];
	associations: ActivityAssociations;
	subscriptions: UserSubscription[] | UserSubscriptionModel[];
	facets: CascadedFacetsForScopes<'PubHeaderTheme'>;
	notificationPreferences: UserNotificationPreferences | UserNotificationPreferencesModel;
};
