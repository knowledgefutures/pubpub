import React from 'react';
import PropTypes from 'prop-types';
import { Popover, PopoverInteractionKind, Position, Button } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';

require('./dropdownButton.scss');

const propTypes = {
	label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
	icon: PropTypes.string,
	intent: PropTypes.string,
	isRightAligned: PropTypes.bool,
	isMinimal: PropTypes.bool,
	isDisabled: PropTypes.bool,
	isSmall: PropTypes.bool,
	isLarge: PropTypes.bool,
	isOpen: PropTypes.bool,
	className: PropTypes.string,
	usePortal: PropTypes.bool,
	children: PropTypes.node,
};

const defaultProps = {
	label: undefined,
	icon: undefined,
	intent: undefined,
	isMinimal: false,
	isDisabled: false,
	isRightAligned: false,
	isSmall: false,
	isLarge: false,
	className: '',
	usePortal: true,
	isOpen: undefined,
	children: undefined,
};

const DropdownButton = function(props) {
	return (
		<Popover
			content={props.children}
			interactionKind={PopoverInteractionKind.CLICK}
			position={props.isRightAligned ? Position.BOTTOM_RIGHT : Position.BOTTOM_LEFT}
			minimal={true}
			transitionDuration={-1}
			inheritDarkTheme={false}
			isOpen={props.isOpen}
			usePortal={props.usePortal}
		>
			{props.icon && !props.label ? (
				<Button
					disabled={props.isDisabled}
					className={`dropdown-button ${props.className}`}
					large={props.isLarge}
					small={props.isSmall}
					minimal={props.isMinimal}
					intent={props.intent}
					icon={<Icon icon={props.icon} />}
				/>
			) : (
				<Button
					disabled={props.isDisabled}
					className={`dropdown-button ${props.className}`}
					large={props.isLarge}
					small={props.isSmall}
					minimal={props.isMinimal}
					intent={props.intent}
					rightIcon={<Icon icon="caret-down" />}
					text={
						<span>
							{props.icon && <Icon icon={props.icon} />}
							{props.label.trim ? props.label.trim() : props.label}
						</span>
					}
				/>
			)}
		</Popover>
	);
};

DropdownButton.defaultProps = defaultProps;
DropdownButton.propTypes = propTypes;
export default DropdownButton;
