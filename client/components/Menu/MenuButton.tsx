import React from 'react';
import { Button } from '@blueprintjs/core';

import Icon from 'components/Icon/Icon';
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
					// @ts-expect-error ts-migrate(2322) FIXME: Type '((instance: any) => void) | RefObject<any> |... Remove this comment to see the full error message
					elementRef={ref}
				/>
			)}
			{...restProps}
		>
			{children}
		</Menu>
	);
};
