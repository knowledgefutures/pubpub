import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Classes, Icon } from '@blueprintjs/core';
import * as RK from 'reakit/Menu';

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
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'active' does not exist on type '{ childr... Remove this comment to see the full error message
		active,
		children,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'className' does not exist on type '{ chi... Remove this comment to see the full error message
		className,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'disabled' does not exist on type '{ chil... Remove this comment to see the full error message
		disabled,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'hasSubmenu' does not exist on type '{ ch... Remove this comment to see the full error message
		hasSubmenu,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'href' does not exist on type '{ children... Remove this comment to see the full error message
		href,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'icon' does not exist on type '{ children... Remove this comment to see the full error message
		icon,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'onClick' does not exist on type '{ child... Remove this comment to see the full error message
		onClick,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'onDismiss' does not exist on type '{ chi... Remove this comment to see the full error message
		onDismiss,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'rightElement' does not exist on type '{ ... Remove this comment to see the full error message
		rightElement,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'target' does not exist on type '{ childr... Remove this comment to see the full error message
		target,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'textClassName' does not exist on type '{... Remove this comment to see the full error message
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
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'unknown' is not assignable to type 'HTMLLIEl... Remove this comment to see the full error message
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
				{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'false | E... Remove this comment to see the full error message */}
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
	// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
	hasSubmenu: PropTypes.bool,
	onDismiss: PropTypes.func,
};

DisplayMenuItem.defaultProps = {
	...sharedDefaultProps,
	// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
	hasSubmenu: false,
	onDismiss: null,
};

export const MenuItem = React.forwardRef((props, ref) => {
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'text' does not exist on type '{ children... Remove this comment to see the full error message
	const { children, text, dismissOnClick, ...restProps } = props;
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'dismissMenu' does not exist on type 'nul... Remove this comment to see the full error message
	const { dismissMenu, parentMenu } = useContext(MenuContext);
	if (children) {
		return (
			// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
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
	// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
	children: PropTypes.arrayOf(PropTypes.node),
	text: PropTypes.node.isRequired,
	dismissOnClick: PropTypes.bool,
};

MenuItem.defaultProps = {
	...sharedDefaultProps,
	// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
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
