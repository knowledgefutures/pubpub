import { useState, useEffect, useMemo } from 'react';

import { UserNotificationsFetchResult } from 'types';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

import { NotificationsContext, NotificationsState } from './types';
import { createInitialState } from './state';
import { bindActions } from './actions';

type ReturnType = null | {
	state: NotificationsState;
	context: Omit<NotificationsContext, 'container'>;
};

export const useNotificationsState = (): ReturnType => {
	const [state, setState] = useState<null | NotificationsState>(null);
	const actions = useMemo(() => bindActions(setState as any), []);
	const {
		loginData: { id: userId },
	} = usePageContext();

	useEffect(() => {
		if (userId) {
			apiFetch.get('/api/userNotifications').then((result: UserNotificationsFetchResult) => {
				setState(createInitialState({ ...result, userId }));
			});
		}
	}, [userId]);

	if (state) {
		const { notificationPreferences } = state;
		return {
			state,
			context: {
				notificationPreferences,
				actions,
			},
		};
	}

	return null;
};
