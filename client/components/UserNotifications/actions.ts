import { UserSubscription, UserNotificationPreferences, PatchFn } from 'types';

import { apiFetch } from 'client/utils/apiFetch';
import { flattenOnce } from 'utils/arrays';
import {
	PubLocation,
	ThreadLocation,
	ThreadNotificationsState,
	NotificationsState,
	PubNotificationsState,
} from './types';
import { updatePub, updateThread } from './state';

type SetNotificationsState = PatchFn<NotificationsState>;

type Bound<R extends Record<string, (...args: any[]) => any>> = {
	[K in keyof R]: ReturnType<R[K]>;
};

const updateSubscriptionStatus = (setState: SetNotificationsState) => {
	return (location: ThreadLocation | PubLocation, subscription: UserSubscription) => {
		setState((state) => {
			if ('threadId' in location) {
				return updateThread(state, location, { subscription });
			}
			return updatePub(state, location, { subscription });
		});
	};
};

const updateThreadReadStatus = (setState: SetNotificationsState) => {
	return async (
		threadState: ThreadNotificationsState,
		options: {
			isRead: boolean;
			manuallySetIsRead: boolean;
			useBeacon?: true;
		},
	) => {
		const { isRead, manuallySetIsRead, useBeacon } = options;
		const userNotificationIds = threadState.notifications.map((n) => n.id);
		setState((state) =>
			updateThread(state, threadState.location, (thread) => {
				return {
					notifications: thread.notifications.map((notification) => {
						return {
							...notification,
							isRead,
							manuallySetIsRead,
						};
					}),
				};
			}),
		);
		if (useBeacon && 'sendBeacon' in navigator) {
			const blob = new Blob(
				[JSON.stringify({ userNotificationIds, isRead, manuallySetIsRead })],
				{ type: 'application/json' },
			);
			navigator.sendBeacon('/api/userNotifications', blob);
		} else {
			await apiFetch.post('/api/userNotifications', {
				userNotificationIds,
				isRead,
				manuallySetIsRead,
			});
		}
	};
};

const updateUserNotificationPreferences = (setState: SetNotificationsState) => {
	return async (preferences: Partial<UserNotificationPreferences>) => {
		setState((state) => {
			return {
				...state,
				notificationPreferences: { ...state.notificationPreferences, ...preferences },
			};
		});
		await apiFetch.put('/api/userNotificationPreferences', { preferences });
	};
};

const dismissThread = (setState: SetNotificationsState) => {
	return async (location: ThreadLocation, threadState: ThreadNotificationsState) => {
		setState((state) => updateThread(state, location, null));
		const userNotificationIds = threadState.notifications.map(
			(notification) => notification.id,
		);
		await apiFetch.delete('/api/userNotifications', { userNotificationIds });
	};
};

const dismissPubThreads = (setState: SetNotificationsState) => {
	return async (location: PubLocation, pubState: PubNotificationsState) => {
		setState((state) => updatePub(state, location, null));
		const userNotificationIds = flattenOnce(
			pubState.threadStates.map((threadState) =>
				threadState.notifications.map((notification) => notification.id),
			),
		);
		await apiFetch.delete('/api/userNotifications', { userNotificationIds });
	};
};

const actions = {
	updateSubscriptionStatus,
	updateThreadReadStatus,
	updateUserNotificationPreferences,
	dismissPubThreads,
	dismissThread,
};

export const bindActions = (updateState: SetNotificationsState): Bound<typeof actions> => {
	const boundActions: Partial<Bound<typeof actions>> = {};
	Object.entries(actions).forEach(([key, fn]) => {
		boundActions[key] = fn(updateState);
	});
	return boundActions as Bound<typeof actions>;
};
