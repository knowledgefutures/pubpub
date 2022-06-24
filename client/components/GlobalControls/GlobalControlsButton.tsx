import React from 'react';
import classNames from 'classnames';
import { Button, IButtonProps, AnchorButton } from '@blueprintjs/core';
import omit from 'lodash.omit';

import { Callback } from 'types';
import { Icon, IconName, MobileAware, MobileAwareRenderProps } from 'components';

type OnClickProps = {
	href?: string;
	onClick?: Callback<any>;
};

type DisplayOptions = {
	icon?: IconName;
} & Pick<IButtonProps, 'rightIcon' | 'text'>;

type MobileOrDesktopProps =
	| { mobile: DisplayOptions; desktop: DisplayOptions }
	| { mobileOrDesktop: DisplayOptions };

type PartialButtonProps = Omit<IButtonProps, 'icon' | 'text' | 'onClick'> &
	Omit<React.ComponentProps<typeof AnchorButton>, 'icon' | 'text' | 'href'>;

type Props = OnClickProps & MobileOrDesktopProps & PartialButtonProps;

const resolveDisplayOptions = (props: Props, isMobileButton: boolean) => {
	if ('mobileOrDesktop' in props) {
		return props.mobileOrDesktop;
	}
	return isMobileButton ? props.mobile : props.desktop;
};

const resolveDisplayOptionsProps = (
	props: Props,
	isMobileButton: boolean,
	iconProps?: React.ComponentProps<typeof Icon>,
) => {
	const { icon, ...rest } = resolveDisplayOptions(props, isMobileButton);
	const iconElement = icon ? <Icon {...iconProps} icon={icon} /> : null;
	return { ...rest, icon: iconElement };
};

const GlobalControlsButton = React.forwardRef((props: Props, ref: React.Ref<unknown>) => {
	const { href, onClick, className, minimal = true, ...buttonProps } = props;

	const renderMobileOrDesktopButton = (
		isMobileButton: boolean,
		renderProps: MobileAwareRenderProps,
	) => {
		const sharedProps = {
			...omit(buttonProps, 'mobile', 'desktop', 'mobileOrDesktop'),
			...resolveDisplayOptionsProps(props, isMobileButton),
			minimal,
			elementRef: renderProps.ref as any,
			large: !isMobileButton,
			className: classNames(className, renderProps.className),
		};
		if (href) {
			return <AnchorButton href={href} {...sharedProps} />;
		}
		return <Button onClick={onClick} {...sharedProps} />;
	};

	return (
		<MobileAware
			ref={ref}
			desktop={(renderProps) => renderMobileOrDesktopButton(false, renderProps)}
			mobile={(renderProps) => renderMobileOrDesktopButton(true, renderProps)}
		/>
	);
});

export default GlobalControlsButton;
