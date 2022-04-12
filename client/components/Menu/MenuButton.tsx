import React from 'react';
import { Button } from '@blueprintjs/core';

import Icon, { IconName } from 'components/Icon/Icon';
import { Menu, MenuProps } from './Menu';

type MenuButtonProps = {
	buttonContent?: React.ReactNode;
	buttonProps?: {
		className?: string;
		fill?: boolean;
		large?: boolean;
		outlined?: boolean;
		icon?: IconName | React.ReactNode;
		rightIcon?: IconName | React.ReactNode;
		minimal?: boolean;
		small?: boolean;
		loading?: boolean;
	};
	disabled?: boolean;
	children: React.ReactNode;
} & Omit<MenuProps, 'disclosure'>;

const getIconProp = (icon: IconName | React.ReactNode) => {
	if (icon && typeof icon === 'string') {
		return <Icon icon={icon as any} />;
	}
	return icon;
};

export const MenuButton = (props: MenuButtonProps) => {
	const { placement, buttonContent, children, buttonProps, ...restProps } = props;

	const buttonPropsWithIcon = {
		...buttonProps,
		icon: getIconProp(props.buttonProps?.icon),
	};

	return (
		<Menu
			placement={placement}
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
