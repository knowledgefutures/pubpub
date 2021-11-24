import React from 'react';
import { Classes, IconName } from '@blueprintjs/core';

import { Menu, MenuButton, MenuItem } from 'components';
import { UserSubscriptionStatus } from 'types';
import { adaptDisclosureElementForBlueprintButton } from '../Popover/blueprintAdapter';

import { useSubscriptionState, SubscriptionStateOptions } from './useSubscriptionState';

type Props = SubscriptionStateOptions &
	Pick<React.ComponentProps<typeof MenuButton>, 'buttonProps'> & {
		children: React.ReactElement;
		menuLabel?: React.ReactNode;
	};

const pubItems = [
	{ value: 'active', label: <>Enabled</> },
	{ value: 'inactive', label: <>Disabled</> },
] as const;

const threadItems = [
	{ value: 'active', label: <>Enabled</> },
	{ value: 'inactive', label: <>Only if subscribed to Pub</> },
	{ value: 'muted', label: <>Muted</> },
] as const;

const iconForStatus: Record<UserSubscriptionStatus, IconName> = {
	active: 'notifications-updated',
	inactive: 'notifications',
	muted: 'ban-circle',
};

const SubscriptionButton = (props: Props) => {
	const { target, subscription, parentSubscription, onUpdateSubscription, children, menuLabel } =
		props;
	const { status, isLoading, updateStatus } = useSubscriptionState({
		target,
		subscription,
		parentSubscription,
		onUpdateSubscription,
	});
	const isPub = 'pubId' in target;
	const noun = isPub ? 'Pub' : 'thread';
	const items = isPub ? pubItems : threadItems;
	const icon = iconForStatus[status];

	return (
		<Menu
			disclosure={(disclosureProps) =>
				adaptDisclosureElementForBlueprintButton(
					children,
					{ ...disclosureProps, loading: isLoading, icon },
					disclosureProps.visible,
				)
			}
		>
			<li className={Classes.MENU_HEADER}>
				<h6 className={Classes.HEADING}>{menuLabel || `Notifications for this ${noun}`}</h6>
			</li>
			{(items as any).map((item) => {
				const { value, label } = item;
				return (
					<MenuItem
						key={value}
						text={label}
						active={value === status}
						icon={iconForStatus[value]}
						onClick={() => updateStatus(value)}
					/>
				);
			})}
		</Menu>
	);
};

export default SubscriptionButton;
