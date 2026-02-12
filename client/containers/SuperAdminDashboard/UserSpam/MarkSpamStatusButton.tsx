import type { SpamStatus } from 'types';

import React, { useCallback, useState } from 'react';

import { Button } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';

type Props = {
	userId: string;
	status: SpamStatus;
	onStatusChanged: (status: SpamStatus) => unknown;
};

const propsForStatuses: Record<SpamStatus, Partial<React.ComponentProps<typeof Button>>> = {
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
};

const MarkSpamStatusButton = (props: Props) => {
	const { status, userId, onStatusChanged } = props;
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = useCallback(async () => {
		setIsLoading(true);
		await apiFetch.put('/api/spamTags/user', { status, userId });
		setIsLoading(false);
		onStatusChanged(status);
	}, [status, userId, onStatusChanged]);

	return (
		<Button minimal loading={isLoading} onClick={handleClick} {...propsForStatuses[status]} />
	);
};

export default MarkSpamStatusButton;
