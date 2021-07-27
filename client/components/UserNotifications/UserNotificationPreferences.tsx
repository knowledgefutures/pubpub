import React from 'react';
import { Classes, FormGroup, Switch, Button } from '@blueprintjs/core';

import * as types from 'types';
import { MenuSelect } from 'components';
import { UserNotificationMarkReadTrigger } from 'types';

require('./userNotificationPreferences.scss');

type Props = {
	preferences: types.UserNotificationPreferences;
	onUpdatePreferences: (patch: Partial<types.UserNotificationPreferences>) => unknown;
	onClose: () => unknown;
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
		<div className="user-notification-preferences-component">
			<h4 className={Classes.HEADING}>Notification preferences</h4>
			<p>
				<Switch
					label="Receive notifications from PubPub"
					checked={receiveNotifications}
					onChange={() => toggle('receiveNotifications')}
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
			<Button icon="tick" intent="primary" onClick={onClose}>
				Done
			</Button>
		</div>
	);
};

export default UserNotificationPreferences;
