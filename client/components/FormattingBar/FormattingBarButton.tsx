import React from 'react';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Classes, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';

import { Icon, IconName } from 'components';

export type FormattingItem = {
	ariaTitle?: string;
	title: string;
	isToggle?: string;
	icon: IconName;
};

export type FormattingBarButtonProps = {
	accentColor: string;
	disabled?: boolean;
	formattingItem: FormattingItem;
	isActive?: boolean;
	isDetached?: boolean;
	isIndicated?: boolean;
	isOpen?: boolean;
	isSmall?: boolean;
	label: string;
	onClick: (formattingItem: FormattingItem) => unknown;
	outerRef: React.RefObject<any>;
	popoverContent?: React.ReactElement;
};

const getOuterStyle = (accentColor, isOpen, isDetached) => {
	if (isOpen && !isDetached) {
		return {
			color: 'white',
			background: accentColor,
		};
	}
	return {};
};

const getInnerStyle = (accentColor, isOpen, isDetached) => {
	if (isOpen && isDetached) {
		return {
			background: accentColor,
		};
	}
	return {};
};

const getIndicatorStyle = (accentColor) => {
	return {
		background: accentColor,
	};
};

const popoverModifiers = { preventOverflow: { enabled: false }, flip: { enabled: false } };

const FormattingBarButton = React.forwardRef((props: FormattingBarButtonProps, ref) => {
	const {
		disabled = false,
		formattingItem,
		isActive = false,
		isIndicated = false,
		isDetached = false,
		isOpen = false,
		isSmall = false,
		label = null,
		onClick,
		accentColor = 'white',
		outerRef,
		popoverContent,
		...restProps
	} = props;

	let button = (
		// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
		<Button
			ref={ref}
			{...restProps}
			role="button"
			disabled={disabled}
			focusable
			title={formattingItem.title}
			aria-label={formattingItem.ariaTitle || formattingItem.title}
			aria-pressed={formattingItem.isToggle ? isActive : undefined}
			className={classNames(
				Classes.BUTTON,
				Classes.MINIMAL,
				!isOpen && !isIndicated && isActive && Classes.ACTIVE,
				isSmall && Classes.SMALL,
				!isOpen && !isIndicated && disabled && Classes.DISABLED,
			)}
			style={getInnerStyle(accentColor, isOpen, isDetached)}
			onClick={() => onClick(formattingItem)}
		>
			<Icon icon={formattingItem.icon} iconSize={isSmall ? 12 : 16} />
			{label}
		</Button>
	);

	if (popoverContent) {
		button = (
			<Popover
				content={popoverContent}
				interactionKind={PopoverInteractionKind.HOVER}
				modifiers={popoverModifiers}
				openOnTargetFocus
				minimal
				position={Position.BOTTOM}
			>
				{button}
			</Popover>
		);
	}

	return (
		<span
			ref={outerRef}
			className={classNames(
				'formatting-bar-button',
				isOpen && 'open',
				isDetached && 'detached',
				!!label && 'has-label',
			)}
			style={getOuterStyle(accentColor, isOpen, isDetached)}
		>
			{button}
			{isIndicated && <div className="indicator" style={getIndicatorStyle(accentColor)} />}
		</span>
	);
});

export default FormattingBarButton;
