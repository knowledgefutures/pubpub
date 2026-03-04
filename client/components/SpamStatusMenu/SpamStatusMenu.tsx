import type { SpamStatus } from 'types';

import React, { useCallback, useState } from 'react';

import { apiFetch } from 'client/utils/apiFetch';
import { Icon } from 'components';
import { MenuButton, MenuItem, MenuItemDivider } from 'components/Menu';

type Props = {
	userId: string;
	currentStatus?: SpamStatus | null;
	onStatusChanged?: (status: SpamStatus | null) => void;
	small?: boolean;
};

const statusLabels: Record<SpamStatus, { label: string; icon: string }> = {
	'confirmed-spam': { label: 'Mark as spam', icon: 'cross' },
	'confirmed-not-spam': { label: 'Mark as not spam', icon: 'tick' },
	unreviewed: { label: 'Mark as unreviewed', icon: 'undo' },
};

const SpamStatusMenu = (props: Props) => {
	const { userId, currentStatus = null, onStatusChanged, small = true } = props;
	const [isLoading, setIsLoading] = useState(false);

	const handleSetStatus = useCallback(
		async (status: SpamStatus) => {
			setIsLoading(true);
			try {
				await apiFetch.put('/api/spamTags/user', { status, userId });
				onStatusChanged?.(status);
			} finally {
				setIsLoading(false);
			}
		},
		[userId, onStatusChanged],
	);

	const handleRemoveTag = useCallback(async () => {
		setIsLoading(true);
		try {
			await apiFetch.delete('/api/spamTags/user', { userId });
			onStatusChanged?.(null);
		} finally {
			setIsLoading(false);
		}
	}, [userId, onStatusChanged]);

	return (
		<MenuButton
			aria-label="Spam actions"
			buttonContent="Spam"
			buttonProps={{
				icon: <Icon icon="flag" iconSize={small ? 12 : 14} />,
				minimal: true,
				small,
				loading: isLoading,
			}}
		>
			{(Object.keys(statusLabels) as SpamStatus[]).map((status) => (
				<MenuItem
					key={status}
					text={statusLabels[status].label}
					icon={status === currentStatus ? 'tick' : 'blank'}
					onClick={() => handleSetStatus(status)}
				/>
			))}
			{currentStatus && (
				<>
					<MenuItemDivider />
					<MenuItem text="Remove spam tag" icon="trash" onClick={handleRemoveTag} />
				</>
			)}
		</MenuButton>
	);
};

export default SpamStatusMenu;
