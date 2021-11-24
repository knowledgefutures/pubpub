import React, { useMemo } from 'react';
import { Button } from '@blueprintjs/core';

import { Popover } from 'components';

import UserNotifications from './UserNotifications';
import { useNotificationsState } from './useNotificationsState';
import { UserNotificationsContext } from './userNotificationsContext';
import { NotificationsState } from './types';

require('./userNotifications.scss');

const getUnreadCount = (state: NotificationsState) => {
	return state.pubStates
		.map(
			(pub) =>
				pub.threadStates.filter((thread) =>
					thread.notifications.some((notification) => !notification.isRead),
				).length,
		)
		.reduce((a, b) => a + b, 0);
};

const renderUnreadCount = (count: number) => {
	if (count > 0) {
		return (
			<div className="unread-count">
				<span className="inner">{count}</span>
			</div>
		);
	}
	return null;
};

const UserNotificationsPopover = () => {
	const userNotifications = useNotificationsState();
	const userNotificationsState = userNotifications?.state;

	const unreadCount = useMemo(
		() => (userNotificationsState ? getUnreadCount(userNotificationsState) : 0),
		[userNotificationsState],
	);

	if (userNotifications && userNotifications.state.hasNotifications) {
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
					<Button
						className="user-notifications-button"
						icon={renderUnreadCount(unreadCount)}
						rightIcon="caret-down"
						minimal
						large
					>
						Threads
					</Button>
				</Popover>
			</UserNotificationsContext.Provider>
		);
	}

	return null;
};

export default UserNotificationsPopover;
