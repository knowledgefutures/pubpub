import React, { useState } from 'react';
import classNames from 'classnames';
import { Button, Classes, InputGroup } from '@blueprintjs/core';

import { FilterTerm, NotificationsState } from './types';
import { useNotificationsContext } from './userNotificationsContext';
import PubNotifications from './PubNotifications';
import UserNotificationPreferences from './UserNotificationPreferences';

type Props = {
	state: NotificationsState;
};

const UserNotifications = (props: Props) => {
	const { state } = props;
	const { pubStates } = state;
	const [filterTerm, setFilterTerm] = useState<FilterTerm>(null);
	const [container, setContainer] = useState<null | HTMLDivElement>(null);
	const [showingPreferences, setShowingPreferences] = useState(false);
	const { actions } = useNotificationsContext();

	const renderPreferences = () => {
		return (
			<UserNotificationPreferences
				preferences={state.notificationPreferences}
				onUpdatePreferences={actions.updateUserNotificationPreferences}
				onClose={() => setShowingPreferences(false)}
			/>
		);
	};

	const renderNotifications = () => {
		return (
			<>
				<div className="top-controls-bar">
					<InputGroup
						fill
						leftIcon="search"
						value={filterTerm || ''}
						placeholder="Filter threads"
						onChange={(evt: any) => setFilterTerm(evt.target.value)}
					/>
					<Button
						minimal
						className="preferences-button"
						icon="settings"
						onClick={() => setShowingPreferences(true)}
					/>
				</div>
				<div className="pubs">
					{pubStates.map((pubState) => (
						<PubNotifications
							state={pubState}
							key={pubState.pub.id}
							filterTerm={filterTerm}
							container={container}
						/>
					))}
				</div>
			</>
		);
	};

	return (
		<div
			ref={setContainer}
			className={classNames(
				'user-notifications-component',
				Classes.CARD,
				Classes.ELEVATION_2,
			)}
		>
			{showingPreferences ? renderPreferences() : renderNotifications()}
		</div>
	);
};

export default UserNotifications;
