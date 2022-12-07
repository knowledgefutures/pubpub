import React, { useCallback, useState } from 'react';
import { Button } from '@blueprintjs/core';

import { SpamStatus } from 'types';
import { apiFetch } from 'client/utils/apiFetch';

type Props = {
	communityId: string;
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
	const { status, communityId, onStatusChanged } = props;
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = useCallback(async () => {
		setIsLoading(true);
		await apiFetch.put('/api/spamTags', { status, communityId });
		setIsLoading(false);
		onStatusChanged(status);
	}, [status, communityId, onStatusChanged]);

	return (
		<Button minimal loading={isLoading} onClick={handleClick} {...propsForStatuses[status]} />
	);
};

export default MarkSpamStatusButton;
