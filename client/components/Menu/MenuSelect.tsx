import React from 'react';
import { Button } from '@blueprintjs/core';

import { MenuItem } from './MenuItem';
import { MenuButton } from './MenuButton';

export type MenuSelectItem<Value> = {
	value: Value;
	label: React.ReactNode;
};

export type MenuSelectItems<Value> = MenuSelectItem<Value>[];

type Props<Value> = {
	'aria-label': string;
	buttonProps?: {};
	defaultLabel?: React.ReactNode;
	icon?: React.ComponentProps<typeof Button>['icon'];
	items: MenuSelectItems<Value>;
	onSelectValue: (value: Value) => unknown;
	prefix?: React.ReactNode;
	rightIcon?: string;
	showTickIcon?: boolean;
	value: null | Value;
};

export const MenuSelect = <Values extends string>(props: Props<Values>) => {
	const {
		'aria-label': ariaLabel,
		icon,
		value,
		items,
		onSelectValue,
		buttonProps,
		showTickIcon = true,
		prefix = null,
		rightIcon = 'caret-down',
		defaultLabel = 'Select...',
	} = props;
	const selectedItem = value && items.find((item) => item.value === value);
	return (
		<MenuButton
			aria-label={ariaLabel}
			buttonContent={
				<>
					{prefix}
					{selectedItem?.label || defaultLabel}
				</>
			}
			buttonProps={{ icon, rightIcon, outlined: true, ...buttonProps }}
		>
			{items.map((item) => (
				<MenuItem
					icon={showTickIcon && (item === selectedItem ? 'tick' : 'blank')}
					active={item === selectedItem}
					onClick={() => onSelectValue(item.value)}
					text={item.label}
				/>
			))}
		</MenuButton>
	);
};
