import type * as types from 'types';
import type { UserNotificationMarkReadTrigger } from 'types';

import React from 'react';

import { Button, Classes, FormGroup, Switch } from '@blueprintjs/core';
import classNames from 'classnames';

import { MenuSelect } from 'components';

import './userNotificationPreferences.scss';

type Props = {
	preferences: types.UserNotificationPreferences;
	minimal?: boolean;
	onUpdatePreferences: (patch: Partial<types.UserNotificationPreferences>) => unknown;
	onClose?: () => unknown;
};

const notificationCadenceItems = [
	{ value: 0, label: 'Immediately when they appear' },
	{ value: 15, label: 'No more than once every 15 minutes' },
	{ value: 60, label: 'No more than once an hour' },
	{ value: 4 * 60, label: 'No more than once every 4 hours' },
	{ value: 8 * 60, label: 'No more than once every 8 hours' },
];

const markReadTriggerItems = [
	{ value: 'seen' as const, label: 'When seen' },
	{ value: 'clicked-through' as const, label: 'When clicked through' },
	{ value: 'manual' as const, label: 'Manually' },
];

const UserNotificationPreferences = (props: Props) => {
	const { preferences, onUpdatePreferences, onClose } = props;
	const {
		receiveNotifications,
		receiveDiscussionThreadEmails,
		subscribeToThreadsAsCommenter,
		subscribeToPubsAsMember,
		subscribeToPubsAsContributor,
		notificationCadence,
		markReadTrigger,
	} = preferences;

	const toggle = (field: keyof types.UserNotificationPreferences) => {
		onUpdatePreferences({ [field]: !preferences[field] });
	};

	return (
		<div
			className={classNames(
				'user-notification-preferences-component',
				props.minimal && 'minimal',
			)}
		>
			{!props.minimal && <h4 className={Classes.HEADING}>Notification preferences</h4>}
			<p>
				<Switch
					label="Receive notifications from PubPub"
					checked={receiveNotifications}
					onChange={() => toggle('receiveNotifications')}
				/>
				<Switch
					label="Receive discussion thread emails from PubPub"
					checked={receiveDiscussionThreadEmails}
					onChange={() => toggle('receiveDiscussionThreadEmails')}
				/>
			</p>
			<FormGroup label="Automatically subscribe me to..." disabled={!receiveNotifications}>
				<Switch
					disabled={!receiveNotifications}
					label="Threads that I comment in"
					checked={subscribeToThreadsAsCommenter}
					onChange={() => toggle('subscribeToThreadsAsCommenter')}
				/>
				<Switch
					disabled={!receiveNotifications}
					label="Pubs that I am added to as a Member"
					checked={subscribeToPubsAsMember}
					onChange={() => toggle('subscribeToPubsAsMember')}
				/>
				<Switch
					disabled={!receiveNotifications}
					label="Pubs that I am added to as a contributor"
					checked={subscribeToPubsAsContributor}
					onChange={() => toggle('subscribeToPubsAsContributor')}
				/>
			</FormGroup>
			<FormGroup label="Show new notifications..." disabled={!receiveNotifications}>
				<MenuSelect<number>
					disabled={!receiveNotifications}
					aria-label="Select notification cadence"
					items={notificationCadenceItems}
					value={notificationCadence}
					onSelectValue={(cadence) =>
						onUpdatePreferences({ notificationCadence: cadence })
					}
				/>
			</FormGroup>
			<FormGroup label="Mark notifications read..." disabled={!receiveNotifications}>
				<MenuSelect<UserNotificationMarkReadTrigger>
					disabled={!receiveNotifications}
					aria-label="Select when notifications should be marked read"
					items={markReadTriggerItems}
					value={markReadTrigger}
					onSelectValue={(trigger) => onUpdatePreferences({ markReadTrigger: trigger })}
				/>
			</FormGroup>
			{!props.minimal && (
				<Button icon="tick" intent="primary" onClick={onClose}>
					Done
				</Button>
			)}
		</div>
	);
};

export default UserNotificationPreferences;
