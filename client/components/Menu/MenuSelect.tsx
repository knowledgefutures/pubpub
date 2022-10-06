import React from 'react';
import { IButtonProps } from '@blueprintjs/core';

import { MenuItem } from './MenuItem';
import { MenuButton } from './MenuButton';

export type MenuSelectItem<Value> = {
	value: Value;
	label: React.ReactNode;
	icon?: React.ReactNode;
	rightElement?: React.ReactNode;
};

export type MenuSelectItems<Value> = MenuSelectItem<Value>[];

type MenuButtonProps = React.ComponentProps<typeof MenuButton>;

type Props<Value> = {
	'aria-label': string;
	defaultLabel?: React.ReactNode;
	disabled?: boolean;
	icon?: IButtonProps['icon'];
	items: MenuSelectItems<Value>;
	onSelectValue: (value: Value) => unknown;
	prefix?: React.ReactNode;
	rightIcon?: IButtonProps['rightIcon'];
	showTickIcon?: boolean;
	value: null | Value;
	className?: string;
} & Pick<MenuButtonProps, 'buttonProps' | 'placement'>;

export const MenuSelect = <Values extends number | string>(props: Props<Values>) => {
	const {
		'aria-label': ariaLabel,
		icon,
		value,
		items,
		onSelectValue,
		buttonProps,
		className,
		placement,
		showTickIcon = true,
		prefix = null,
		disabled = false,
		rightIcon = 'caret-down',
		defaultLabel = 'Select...',
	} = props;
	const selectedItem = value !== null ? items.find((item) => item.value === value) : null;

	return (
		<MenuButton
			disabled={disabled}
			aria-label={ariaLabel}
			buttonContent={
				<>
					{prefix}
					{selectedItem?.label || defaultLabel}
				</>
			}
			buttonProps={{ icon, rightIcon, outlined: true, ...buttonProps }}
			className={className}
			placement={placement}
		>
			{items.map((item) => (
				<MenuItem
					key={item.value}
					icon={showTickIcon ? (item === selectedItem ? 'tick' : 'blank') : item.icon}
					active={item === selectedItem}
					onClick={() => onSelectValue(item.value)}
					text={item.label}
					rightElement={item.rightElement}
				/>
			))}
		</MenuButton>
	);
};
