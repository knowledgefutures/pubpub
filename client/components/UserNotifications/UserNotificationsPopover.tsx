import type { InitialNotificationsData, Maybe } from 'types';

import type { NotificationsState } from './types';

import React, { useMemo } from 'react';

import { Popover } from 'components';
import { usePageContext } from 'utils/hooks';

import UserNotifications from './UserNotifications';
import { useNotificationsState } from './useNotificationsState';
import { UserNotificationsContext } from './userNotificationsContext';

import './userNotifications.scss';

type ButtonRenderOptions = { hasUnreadNotifications: boolean };

type Props = {
	children: (opts: ButtonRenderOptions) => React.ReactElement;
};

const getNotificationsData = (
	initialNotificationsData: InitialNotificationsData,
	notificationsState: Maybe<NotificationsState>,
): InitialNotificationsData => {
	if (notificationsState) {
		const { hasNotifications: initiallyHadNotifications } = initialNotificationsData;
		const { pubStates } = notificationsState;
		const hasUnreadNotifications = pubStates.some((pub) =>
			pub.threadStates.some((thread) =>
				thread.notifications.some((notification) => !notification.isRead),
			),
		);
		return {
			// Keep the popover visible for the lifetime of the page, even after
			// all notifications have been dismissed.
			hasNotifications: pubStates.length > 0 || initiallyHadNotifications,
			hasUnreadNotifications,
		};
	}
	return initialNotificationsData;
};

const UserNotificationsPopover = (props: Props) => {
	const { children } = props;
	const { initialNotificationsData } = usePageContext();
	const userNotifications = useNotificationsState();

	const { hasNotifications, hasUnreadNotifications } = useMemo(
		() => getNotificationsData(initialNotificationsData, userNotifications?.state),
		[initialNotificationsData, userNotifications],
	);

	if (hasNotifications) {
		const button = children({ hasUnreadNotifications });
		if (userNotifications) {
			const { state, context } = userNotifications;
			return (
				<UserNotificationsContext.Provider value={context}>
					<Popover
						aria-label="Notifications"
						placement="bottom-end"
						className="user-notifications-popover"
						content={<UserNotifications state={state} />}
						preventBodyScroll={false}
						unstable_fixed
					>
						{button}
					</Popover>
				</UserNotificationsContext.Provider>
			);
		}
		return button;
	}

	return null;
};

export default UserNotificationsPopover;
