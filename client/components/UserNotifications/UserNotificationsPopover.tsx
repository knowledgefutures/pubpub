import React, { useMemo } from 'react';
import { Button } from '@blueprintjs/core';

import { Icon, Popover } from 'components';
import { InitialNotificationsData, Maybe } from 'types';

import { usePageContext } from 'utils/hooks';
import UserNotifications from './UserNotifications';
import { useNotificationsState } from './useNotificationsState';
import { UserNotificationsContext } from './userNotificationsContext';
import { NotificationsState } from './types';

require('./userNotifications.scss');

const getNotificationsData = (
	initialNotificationsData: InitialNotificationsData,
	notificationsState: Maybe<NotificationsState>,
): InitialNotificationsData => {
	if (notificationsState) {
		const { pubStates } = notificationsState;
		const hasUnreadNotifications = pubStates.some((pub) =>
			pub.threadStates.some((thread) =>
				thread.notifications.some((notification) => !notification.isRead),
			),
		);
		return { hasNotifications: pubStates.length > 0, hasUnreadNotifications };
	}
	return initialNotificationsData;
};

const UserNotificationsPopover = () => {
	const userNotifications = useNotificationsState();
	const { initialNotificationsData } = usePageContext();

	const { hasNotifications, hasUnreadNotifications } = useMemo(
		() => getNotificationsData(initialNotificationsData, userNotifications?.state),
		[initialNotificationsData, userNotifications],
	);

	if (hasNotifications) {
		const button = (
			<Button
				className="user-notifications-button"
				icon={<Icon icon={hasUnreadNotifications ? 'inbox-update' : 'inbox'} />}
				minimal
				large
			/>
		);
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
