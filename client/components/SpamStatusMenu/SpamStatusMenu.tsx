import type { SpamAction } from 'client/containers/SuperAdminDashboard/UserSpam/MarkSpamStatusButton';
import type { SpamStatus } from 'types';

import React, { useCallback, useState } from 'react';

import UserSpamActions from 'client/containers/SuperAdminDashboard/UserSpam/UserSpamActions';
import { apiFetch } from 'client/utils/apiFetch';
import { Icon } from 'components';
import { MenuButton } from 'components/Menu';

import './SpamStatusMenu.scss';

type Props = {
	userId: string;
	currentStatus?: SpamStatus | null;
	onStatusChanged?: (status: SpamStatus | null) => void;
	small?: boolean;
};

const SpamStatusMenu = (props: Props) => {
	const { userId, currentStatus = null, onStatusChanged, small = true } = props;
	const [isLoading, setIsLoading] = useState(false);

	const handleAction = useCallback(
		async (action: SpamAction) => {
			setIsLoading(true);

			try {
				if (action === 'remove') {
					await apiFetch.delete('/api/spamTags/user', { userId });
				} else {
					await apiFetch.put('/api/spamTags/user', { status: action, userId });
				}
				onStatusChanged?.(action === 'remove' ? null : action);
			} finally {
				setIsLoading(false);
			}
		},
		[userId, onStatusChanged],
	);

	return (
		<MenuButton
			aria-label="Spam actions"
			buttonContent="Spam"
			className="spam-menu"
			buttonProps={{
				icon: <Icon icon="shield" iconSize={small ? 12 : 14} />,
				minimal: true,
				small,
				loading: isLoading,
				className: 'spam-button',
			}}
		>
			<UserSpamActions userId={userId} status={currentStatus} handleAction={handleAction} />
		</MenuButton>
	);
};

export default SpamStatusMenu;
