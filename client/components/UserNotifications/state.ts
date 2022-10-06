import { renderActivityItem } from 'client/utils/activity';
import {
	ActivityItem,
	PatchFnArg,
	Pub,
	ScopeId,
	Thread,
	UserNotificationWithActivityItem,
} from 'types';
import { bucketBy, flattenOnce, splitArrayOn } from 'utils/arrays';

import {
	NotificationsState,
	PubNotificationsState,
	ThreadNotificationsState,
	PubLocation,
	ThreadLocation,
	NotificationsInitializer,
} from './types';

const resolvePatch = <T>(currentState: T, patchFnArg: PatchFnArg<T>) => {
	if (typeof patchFnArg === 'function') {
		return patchFnArg(currentState);
	}
	return patchFnArg;
};

export const updatePub = (
	state: NotificationsState,
	location: PubLocation,
	getNextState: PatchFnArg<PubNotificationsState>,
): NotificationsState => {
	return {
		...state,
		pubStates: state.pubStates
			.map((pubState) => {
				if (pubState.pub.id === location.pubId) {
					const patch = resolvePatch(pubState, getNextState);
					if (patch) {
						return {
							...pubState,
							...patch,
						};
					}
					return null;
				}
				return pubState;
			})
			.filter((x): x is PubNotificationsState => !!x),
	};
};

export const updateThread = (
	state: NotificationsState,
	location: ThreadLocation,
	getNextState: PatchFnArg<ThreadNotificationsState>,
): NotificationsState => {
	const { pubId, threadId } = location;
	return updatePub(state, { pubId }, (pubState) => {
		return {
			...pubState,
			threadStates: pubState.threadStates
				.map((threadState) => {
					if (threadState.thread.id === threadId) {
						const patch = resolvePatch(threadState, getNextState);
						if (patch) {
							return {
								...threadState,
								...patch,
							};
						}
						return null;
					}
					return threadState;
				})
				.filter((x): x is ThreadNotificationsState => !!x),
		};
	});
};

const sortTimestamps = <Item>(items: Item[], getTimestamp: (t: Item) => string): Item[] => {
	return items.concat().sort((a, b) => {
		const timestampA = getTimestamp(a);
		const timestampB = getTimestamp(b);
		return timestampA < timestampB ? 1 : -1;
	});
};

const sortNotifications = (notifications: UserNotificationWithActivityItem[]) => {
	const [read, unread] = splitArrayOn(notifications, (n) => n.isRead);
	return flattenOnce(
		[unread, read].map((subset) => sortTimestamps(subset, (n) => n.activityItem.timestamp)),
	);
};

const sortThreadStates = (threadStates: ThreadNotificationsState[]) => {
	const [someUnread, allRead] = splitArrayOn(threadStates, (state) => state.initiallyUnread);
	return flattenOnce(
		[someUnread, allRead].map((subset) =>
			sortTimestamps(subset, (state) => state.notifications[0]?.activityItem.timestamp),
		),
	);
};

const sortPubStates = (pubStates: PubNotificationsState[]) => {
	const [someUnread, allRead] = splitArrayOn(pubStates, (state) => state.initiallyUnread);
	return flattenOnce(
		[someUnread, allRead].map((subset) =>
			sortTimestamps(subset, (state) => state.latestUnreadTimestamp),
		),
	);
};

const renderActivityItems = (
	unrenderedActivityItems: ActivityItem[],
	initializer: NotificationsInitializer,
	scope: ScopeId,
) => {
	const otherActorsCount = -1 + new Set(unrenderedActivityItems.map((item) => item.actorId)).size;
	return unrenderedActivityItems.map((item) =>
		renderActivityItem(item, { ...initializer, scope, otherActorsCount }),
	);
};

const createInitialThreadState = (
	thread: Thread,
	notifications: UserNotificationWithActivityItem[],
	initializer: NotificationsInitializer,
	pub: Pub,
): ThreadNotificationsState => {
	const { subscriptions } = initializer;
	const subscription = subscriptions.find((s) => s.threadId === thread.id) ?? null;
	const sortedNotifications = sortNotifications(notifications);
	const activityItems = renderActivityItems(
		sortedNotifications.map((n) => n.activityItem),
		initializer,
		{ communityId: pub.communityId, pubId: pub.id },
	);
	return {
		thread,
		subscription,
		activityItems,
		initiallyUnread: notifications.some((n) => !n.isRead),
		latestUnreadTimestamp: sortedNotifications[0].activityItem.timestamp,
		notifications: sortedNotifications,
		location: { pubId: pub.id, threadId: thread.id },
	};
};

const createInitialPubState = (
	pub: Pub,
	notifications: UserNotificationWithActivityItem[],
	initializer: NotificationsInitializer,
): PubNotificationsState => {
	const { associations, subscriptions, facets } = initializer;
	const location = { pubId: pub.id };
	const notificationsByThread = bucketBy(notifications, (n) => n.activityItem.payload.threadId);
	const subscription = subscriptions.find((s) => s.pubId === pub.id) ?? null;
	const community = associations.community[pub.communityId];
	const threadStates = Object.entries(notificationsByThread).map(
		([threadId, threadNotifications]) =>
			createInitialThreadState(
				associations.thread[threadId],
				threadNotifications,
				initializer,
				pub,
			),
	);
	const pubHeaderTheme = facets.pub[pub.id].PubHeaderTheme.value;
	const sortedThreadStates = sortThreadStates(threadStates);
	return {
		location,
		pub,
		community,
		subscription,
		threadStates: sortedThreadStates,
		initiallyUnread: threadStates.some((state) => state.initiallyUnread),
		latestUnreadTimestamp: sortedThreadStates[0].latestUnreadTimestamp,
		pubHeaderTheme,
	};
};

export const createInitialState = (context: NotificationsInitializer): NotificationsState => {
	const { notifications, associations, notificationPreferences } = context;
	const notificationsByPub = bucketBy(notifications, (n) => n.activityItem.pubId!);
	const pubStates = Object.entries(notificationsByPub).map(([pubId, pubNotifications]) =>
		createInitialPubState(associations.pub[pubId], pubNotifications, context),
	);
	return {
		pubStates: sortPubStates(pubStates),
		hasNotifications: pubStates.length > 0,
		notificationPreferences,
	};
};
