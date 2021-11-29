import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import Color from 'color';
import { Button } from '@blueprintjs/core';

import { User, UserSubscription } from 'types';
import { unique } from 'utils/arrays';
import { TimeAgo, Avatars, SubscriptionButton } from 'components';
import { RenderedActivityItem } from 'client/utils/activity/types';

import { useElementSeen } from 'client/utils/useElementSeen';
import { ThreadNotificationsState } from './types';
import { useNotificationsContext } from './userNotificationsContext';

type Props = {
	parentSubscription: null | UserSubscription;
	state: ThreadNotificationsState;
	container: null | HTMLDivElement;
	communityAccentColor: string;
};

const getAccentColors = (communityAccentColor: string, isRead: boolean) => {
	const opaque = isRead ? '#aaa' : communityAccentColor;
	const transparent = Color(opaque).alpha(0.04);
	return {
		opaque,
		transparent,
	};
};

const getUsersFromActivityItems = (activityItems: RenderedActivityItem[]) => {
	return unique(
		activityItems.map((ai) => ai.actor).filter((x): x is User => !!x),
		(u) => u.id,
	);
};

const ThreadNotifications = (props: Props) => {
	const { state, parentSubscription, container, communityAccentColor } = props;
	const { notifications, location, subscription, activityItems } = state;
	const {
		actions,
		notificationPreferences: { markReadTrigger },
	} = useNotificationsContext();
	const isRead = notifications.every((n) => n.isRead);
	const manuallySetIsRead = notifications.some((n) => n.manuallySetIsRead);
	const accentColors = getAccentColors(communityAccentColor, isRead);
	const [element, setElement] = useState<null | HTMLDivElement>(null);
	const { message, excerpt, timestamp } = activityItems[0];

	useElementSeen({
		container,
		element,
		enabled: !manuallySetIsRead && markReadTrigger === 'seen',
		alreadySeen: isRead,
		onElementSeen: () =>
			actions.updateThreadReadStatus(state, { isRead: true, manuallySetIsRead: false }),
	});

	useEffect(() => {
		if (element && !isRead && markReadTrigger === 'clicked-through') {
			const listener = (evt: MouseEvent | KeyboardEvent) => {
				if (evt.target instanceof HTMLAnchorElement) {
					actions.updateThreadReadStatus(state, {
						isRead: true,
						manuallySetIsRead: true,
						useBeacon: true,
					});
				}
			};
			element.addEventListener('click', listener);
			return () => {
				element.removeEventListener('click', listener);
			};
		}
		return () => {};
	}, [element, isRead, markReadTrigger, actions, state]);

	return (
		<div
			ref={setElement}
			className={classNames('thread-notifications-component', isRead && 'is-read')}
			style={isRead ? {} : { backgroundColor: accentColors.transparent }}
		>
			<div className="top-details">
				<Avatars
					users={getUsersFromActivityItems(activityItems)}
					size={24}
					borderColor={accentColors.opaque}
				/>
				<div className="controls">
					<SubscriptionButton
						target={{ threadId: location.threadId }}
						subscription={subscription}
						parentSubscription={parentSubscription}
						onUpdateSubscription={(status) =>
							actions.updateSubscriptionStatus(location, status)
						}
					>
						<Button small minimal aria-label="Manage subscription" />
					</SubscriptionButton>
					<Button
						small
						minimal
						icon="cross"
						aria-label="Dismiss"
						onClick={() => actions.dismissThread(location, state)}
					/>
				</div>
			</div>
			<div className="message">
				<span
					className={classNames('blip', isRead && 'is-read')}
					style={{ color: accentColors.opaque }}
				/>
				{message}
			</div>
			<div className="excerpt">{excerpt}</div>
			<div className="bottom-details">
				<TimeAgo className="time-ago" date={timestamp} />
				<Button
					small
					minimal
					className="mark-read-button"
					icon={isRead ? 'envelope' : 'tick'}
					onClick={() =>
						actions.updateThreadReadStatus(state, {
							isRead: !isRead,
							manuallySetIsRead: true,
						})
					}
				>
					{isRead ? 'Mark unread' : 'Mark read'}
				</Button>
			</div>
		</div>
	);
};

export default ThreadNotifications;
