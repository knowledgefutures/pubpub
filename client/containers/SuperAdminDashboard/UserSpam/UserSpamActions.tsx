import type { SpamStatus } from 'types';

import React from 'react';

import MarkSpamStatusButton, { type SpamActionHandler } from './MarkSpamStatusButton';

type Props = {
	userId: string;
	status: SpamStatus | null;
	handleAction: SpamActionHandler;
};

const UserSpamActions = (props: Props) => {
	const { userId, status, handleAction } = props;

	if (status === null) {
		return (
			<>
				<MarkSpamStatusButton
					userId={userId}
					action="unreviewed"
					handleAction={handleAction}
				/>
				<MarkSpamStatusButton
					userId={userId}
					action="confirmed-not-spam"
					handleAction={handleAction}
				/>
				<MarkSpamStatusButton
					userId={userId}
					action="confirmed-spam"
					handleAction={handleAction}
				/>
			</>
		);
	}
	if (status === 'unreviewed') {
		return (
			<>
				<MarkSpamStatusButton
					userId={userId}
					action="confirmed-not-spam"
					handleAction={handleAction}
				/>
				<MarkSpamStatusButton
					userId={userId}
					action="confirmed-spam"
					handleAction={handleAction}
				/>
				<MarkSpamStatusButton userId={userId} action="remove" handleAction={handleAction} />
			</>
		);
	}
	if (status === 'confirmed-spam') {
		return (
			<>
				<MarkSpamStatusButton
					userId={userId}
					action="confirmed-not-spam"
					handleAction={handleAction}
					label="Mark as not spam"
				/>
				<MarkSpamStatusButton
					userId={userId}
					action="unreviewed"
					handleAction={handleAction}
				/>
				<MarkSpamStatusButton userId={userId} action="remove" handleAction={handleAction} />
			</>
		);
	}
	return (
		<>
			<MarkSpamStatusButton
				userId={userId}
				action="confirmed-spam"
				handleAction={handleAction}
				label="Mark as spam"
			/>
			<MarkSpamStatusButton userId={userId} action="unreviewed" handleAction={handleAction} />
			<MarkSpamStatusButton userId={userId} action="remove" handleAction={handleAction} />
		</>
	);
};

export default UserSpamActions;
