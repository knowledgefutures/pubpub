import React, { useContext } from 'react';
import classNames from 'classnames';
import * as RK from 'reakit/Menu';
import { Classes, Icon } from '@blueprintjs/core';

import { Menu } from './Menu';
import { MenuContext } from './menuContexts';

type SharedMenuItemProps = {
	active?: boolean;
	children?: React.ReactNode;
	className?: string;
	disabled?: boolean;
	href?: string;
	icon?: string | React.ReactNode;
	onClick?: (event: MouseEvent) => unknown;
	rightElement?: React.ReactNode;
	target?: string;
	textClassName?: string;
};

export type DisplayMenuItemProps = {
	onDismiss: (...args: any[]) => unknown;
	hasSubmenu: boolean;
} & SharedMenuItemProps;

const DisplayMenuItem = React.forwardRef((props: DisplayMenuItemProps, ref) => {
	const {
		active = false,
		children = null,
		className = '',
		disabled = false,
		hasSubmenu = false,
		href,
		icon = null,
		onClick = null,
		onDismiss = null,
		rightElement = null,
		target = '_self',
		textClassName = '',
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
		// @ts-expect-error ts-migrate(2322) FIXME: Type '((instance: unknown) => void) | MutableRefOb... Remove this comment to see the full error message
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

export type MenuItemProps = {
	onClick?: (event: MouseEvent) => unknown;
	text?: React.ReactNode;
	children?: React.ReactNode;
	dismissOnClick?: boolean;
	placement?: string;
	labelElement?: React.ReactNode;
} & SharedMenuItemProps;

export const MenuItem = React.forwardRef((props: MenuItemProps, ref) => {
	const { children = null, text, dismissOnClick = true, ...restProps } = props;
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'dismissMenu' does not exist on type 'nul... Remove this comment to see the full error message
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

export const MenuItemDivider = () => {
	return (
		<RK.MenuSeparator>
			{(props) => <li className={Classes.MENU_DIVIDER} {...props} />}
		</RK.MenuSeparator>
	);
};
