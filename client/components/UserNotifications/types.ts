import { RenderedActivityItem } from 'client/utils/activity/types';
import { FacetValue, PubHeaderTheme } from 'facets';
import {
	Pub,
	Thread,
	UserNotificationWithActivityItem,
	UserSubscription,
	Community,
	UserNotificationPreferences,
	UserNotificationsFetchResult,
} from 'types';

import { bindActions } from './actions';

export type FilterTerm = string | null;

export type PubLocation = {
	pubId: string;
};

export type ThreadLocation = {
	pubId: string;
	threadId: string;
};

type InitialState = {
	initiallyUnread: boolean;
	latestUnreadTimestamp: string;
};

export type ThreadNotificationsState = InitialState & {
	activityItems: RenderedActivityItem[];
	location: ThreadLocation;
	thread: Thread;
	notifications: UserNotificationWithActivityItem[];
	subscription: null | UserSubscription;
};

export type PubNotificationsState = InitialState & {
	location: PubLocation;
	pub: Pub;
	pubHeaderTheme: FacetValue<typeof PubHeaderTheme>;
	community: Community;
	threadStates: ThreadNotificationsState[];
	subscription: null | UserSubscription;
	initiallyUnread: boolean;
};

export type NotificationsState = {
	pubStates: PubNotificationsState[];
	notificationPreferences: UserNotificationPreferences;
	hasNotifications: boolean;
};

export type NotificationsInitializer = UserNotificationsFetchResult & {
	userId: string;
};

export type NotificationsContext = {
	notificationPreferences: UserNotificationPreferences;
	actions: ReturnType<typeof bindActions>;
};
