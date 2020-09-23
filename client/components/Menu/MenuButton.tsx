import React from 'react';
import { Button, IButtonProps } from '@blueprintjs/core';

import { Icon } from 'components';
import { Menu, MenuProps } from './Menu';

type MenuButtonProps = {
	buttonContent?: React.ReactNode;
	buttonProps?: {
		className?: string;
		fill?: boolean;
		large?: boolean;
		outlined?: boolean;
		icon?: string | React.ReactNode;
		rightIcon?: string | React.ReactNode;
		minimal?: boolean;
		small?: boolean;
	};
	disabled?: boolean;
	children: React.ReactNode;
} & Omit<MenuProps, 'disclosure'>;

const getIconProp = (icon) => {
	if (icon && typeof icon === 'string') {
		return <Icon icon={icon} />;
	}
	return icon;
};

export const MenuButton = (props: MenuButtonProps) => {
	const { buttonContent, children, buttonProps, ...restProps } = props;

	const buttonPropsWithIcon = {
		...buttonProps,
		icon: getIconProp(props.buttonProps?.icon),
	};

	return (
		<Menu
			disclosure={({ ref, ...restDisclosureProps }) => (
				<Button
					children={buttonContent}
					{...buttonPropsWithIcon}
					{...restDisclosureProps}
					// @ts-expect-error
					elementRef={ref}
				/>
			)}
			{...restProps}
		>
			{children}
		</Menu>
	);
};
