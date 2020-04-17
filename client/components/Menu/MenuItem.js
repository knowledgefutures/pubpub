import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Classes } from '@blueprintjs/core';
import * as RK from 'reakit/Menu';

import { Icon } from 'components';

import { MenuContext } from './menuContexts';
import { Menu } from './Menu';

const sharedPropTypes = {
	className: PropTypes.string,
	disabled: PropTypes.bool,
	href: PropTypes.string,
	icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
	onClick: PropTypes.func,
	rightElement: PropTypes.node,
	target: PropTypes.string,
	textClassName: PropTypes.string,
};

const sharedDefaultProps = {
	className: '',
	disabled: false,
	href: null,
	icon: null,
	onClick: null,
	rightElement: null,
	target: '_self',
	textClassName: '',
};

const DisplayMenuItem = React.forwardRef((props, ref) => {
	const {
		active,
		children,
		className,
		disabled,
		hasSubmenu,
		href,
		icon,
		onClick,
		onDismiss,
		rightElement,
		target,
		textClassName,
		...restProps
	} = props;

	const label = hasSubmenu ? <Icon icon="caret-right" /> : rightElement;

	const onClickWithHref = (evt) => {
		if (onClick) {
			onClick(evt);
		}
		if (onDismiss) {
			onDismiss();
		}
		if (href) {
			window.open(href, target);
		}
	};

	return (
		// The ...restProps are from Reakit and help us handle the interactions accessibly.
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		<li {...restProps} ref={ref} onClick={onClickWithHref}>
			<a
				href={href}
				target={target}
				className={classNames(
					Classes.MENU_ITEM,
					disabled && Classes.DISABLED,
					active && Classes.ACTIVE,
					className,
				)}
			>
				{icon && (typeof icon === 'string' ? <Icon icon={icon} /> : icon)}
				<div
					className={classNames(
						Classes.TEXT_OVERFLOW_ELLIPSIS,
						Classes.FILL,
						textClassName,
					)}
				>
					{children}
				</div>
				{label && <span className={Classes.MENU_ITEM_LABEL}>{label}</span>}
			</a>
		</li>
	);
});

DisplayMenuItem.propTypes = {
	...sharedPropTypes,
	hasSubmenu: PropTypes.bool,
	onDismiss: PropTypes.func,
};

DisplayMenuItem.defaultProps = {
	...sharedDefaultProps,
	hasSubmenu: false,
	onDismiss: null,
};

export const MenuItem = React.forwardRef((props, ref) => {
	const { children, text, dismissOnClick, ...restProps } = props;
	const { dismissMenu, parentMenu } = useContext(MenuContext);
	if (children) {
		return (
			<Menu
				onDismiss={dismissMenu}
				disclosure={(dProps) => (
					<RK.MenuItem
						as={DisplayMenuItem}
						{...dProps}
						{...parentMenu}
						{...restProps}
						style={{ display: 'block', '-webkit-appearance': 'unset' }}
						hasSubmenu={true}
					>
						{text}
					</RK.MenuItem>
				)}
			>
				{children}
			</Menu>
		);
	}
	return (
		<RK.MenuItem
			as={DisplayMenuItem}
			ref={ref}
			{...parentMenu}
			{...restProps}
			onDismiss={dismissOnClick ? dismissMenu : null}
		>
			{text}
		</RK.MenuItem>
	);
});

MenuItem.propTypes = {
	...sharedPropTypes,
	children: PropTypes.arrayOf(PropTypes.node),
	text: PropTypes.node.isRequired,
	dismissOnClick: PropTypes.bool,
};

MenuItem.defaultProps = {
	...sharedDefaultProps,
	children: null,
	dismissOnClick: true,
};

export const MenuItemDivider = () => {
	return (
		<RK.MenuSeparator>
			{(props) => <li className={Classes.MENU_DIVIDER} {...props} />}
		</RK.MenuSeparator>
	);
};
