import React from 'react';
import PropTypes from 'prop-types';
import { Popover, PopoverInteractionKind, Position, Button } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';

require('./dropdownButton.scss');

const propTypes = {
	label: PropTypes.string,
	icon: PropTypes.string,
	isRightAligned: PropTypes.bool,
	isMinimal: PropTypes.bool,
	isDisabled: PropTypes.bool,
	isSmall: PropTypes.bool,
	isOpen: PropTypes.bool,
	usePortal: PropTypes.bool,
	children: PropTypes.node,
};

const defaultProps = {
	label: undefined,
	icon: undefined,
	isMinimal: false,
	isDisabled: false,
	isRightAligned: false,
	isSmall: false,
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
			popoverClassName="bp3-minimal"
			transitionDuration={-1}
			inheritDarkTheme={false}
			tetherOptions={{
				constraints: [{ attachment: 'together', to: 'window' }]
			}}
			isOpen={props.isOpen}
			usePortal={props.usePortal}
		>
			{props.icon && !props.label
				? <Button
					disabled={props.isDisabled}
					className={`dropdown-button ${props.isSmall ? 'bp3-small' : ''} ${props.isMinimal ? 'bp3-minimal' : ''}`}
					icon={<Icon icon={props.icon} />}
				/>
				: <Button
					disabled={props.isDisabled}
					className={`dropdown-button ${props.isSmall ? 'bp3-small' : ''} ${props.isMinimal ? 'bp3-minimal' : ''}`}
					text={
						<span>
							{props.icon &&
								<Icon icon={props.icon} />
							}
							{props.label.trim()}
							<span className="bp3-icon-standard bp3-icon-caret-down bp3-align-right" />
						</span>
					}
				/>
			}
		</Popover>
	);
};

DropdownButton.defaultProps = defaultProps;
DropdownButton.propTypes = propTypes;
export default DropdownButton;
