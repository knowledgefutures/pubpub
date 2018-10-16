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
	children: PropTypes.node.isRequired,
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
};

const DropdownButton = function(props) {
	return (
		<Popover
			content={props.children}
			interactionKind={PopoverInteractionKind.CLICK}
			position={props.isRightAligned ? Position.BOTTOM_RIGHT : Position.BOTTOM_LEFT}
			popoverClassName="pt-minimal"
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
					className={`dropdown-button ${props.isSmall ? 'pt-small' : ''} ${props.isMinimal ? 'pt-minimal' : ''}`}
					icon={<Icon icon={props.icon} />}
				/>
				: <Button
					disabled={props.isDisabled}
					className={`dropdown-button ${props.isSmall ? 'pt-small' : ''} ${props.isMinimal ? 'pt-minimal' : ''}`}
					text={
						<span>
							{props.icon &&
								<Icon icon={props.icon} />
							}
							{props.label.trim()}
							<span className="pt-icon-standard pt-icon-caret-down pt-align-right" />
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
