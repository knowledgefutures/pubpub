import type { SpamStatus } from 'types';

import React, { useCallback, useState } from 'react';

import { Button } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';

export type SpamAction = SpamStatus | 'remove';
export type SpamActionHandler = (status: SpamAction) => unknown;

type Props = {
	userId: string;
	action: SpamAction;
	handleAction: SpamActionHandler;
	label?: string;
};

const propsForActions: Record<SpamAction, Partial<React.ComponentProps<typeof Button>>> = {
	'confirmed-not-spam': {
		icon: 'tick',
		children: 'Not spam',
	},
	'confirmed-spam': {
		icon: 'cross',
		intent: 'danger',
		children: 'Spam',
	},
	unreviewed: {
		icon: 'undo',
		children: 'Mark unreviewed',
	},
	remove: {
		icon: 'remove',
		children: 'Remove spam tag',
	},
};

const MarkSpamStatusButton = (props: Props) => {
	const { action, userId, handleAction, label } = props;
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = useCallback(async () => {
		setIsLoading(true);

		if (action === 'remove') {
			await apiFetch.delete('/api/spamTags/user', { userId });
		} else {
			await apiFetch.put('/api/spamTags/user', { status: action, userId });
		}
		setIsLoading(false);
		handleAction(action);
	}, [action, userId, handleAction]);

	const buttonProps = propsForActions[action];

	return (
		<Button
			minimal
			small
			loading={isLoading}
			onClick={handleClick}
			{...buttonProps}
			children={label ?? buttonProps?.children}
		/>
	);
};

export default MarkSpamStatusButton;
