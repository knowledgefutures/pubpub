import React from 'react';
import { Button } from '@blueprintjs/core';

import { Icon } from 'components';
import { Menu } from './Menu';

type Props = {
	buttonContent?: React.ReactNode;
	buttonProps?: {
		icon?: string | React.ReactNode;
		rightIcon?: string | React.ReactNode;
		minimal?: boolean;
		small?: boolean;
	};
	children: React.ReactNode;
};

const getIconProp = (icon) => {
	if (icon && typeof icon === 'string') {
		return <Icon icon={icon} />;
	}
	return icon;
};

export const MenuButton = (props: Props) => {
	const { buttonContent = null, children, buttonProps = {}, ...restProps } = props;

	const buttonPropsWithIcon = {
		...buttonProps,
		icon: getIconProp(buttonProps.icon),
	};

	return (
		// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
		<Menu
			disclosure={({ ref, ...restDisclosureProps }) => (
				// @ts-expect-error: need refined icon string values
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
