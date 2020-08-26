import React from 'react';
import { Button } from '@blueprintjs/core';

import { Icon } from 'components';
import { Menu } from './Menu';

type OwnProps = {
	buttonContent?: React.ReactNode;
	buttonProps?: {
		icon?: string | React.ReactNode;
	};
	children: React.ReactNode;
};

const defaultProps = {
	buttonProps: {},
	buttonContent: null,
};

const getIconProp = (icon) => {
	if (icon && typeof icon === 'string') {
		return <Icon icon={icon} />;
	}
	return icon;
};

type Props = OwnProps & typeof defaultProps;

export const MenuButton = (props: Props) => {
	const { buttonContent, children, buttonProps, ...restProps } = props;

	const buttonPropsWithIcon = {
		...buttonProps,
		icon: getIconProp(props.buttonProps.icon),
	};

	return (
		// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
		<Menu
			disclosure={({ ref, ...restDisclosureProps }) => (
				<Button
					children={buttonContent}
					{...buttonPropsWithIcon}
					{...restDisclosureProps}
					elementRef={ref}
				/>
			)}
			{...restProps}
		>
			{children}
		</Menu>
	);
};
MenuButton.defaultProps = defaultProps;
