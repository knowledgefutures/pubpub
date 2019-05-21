import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, AnchorButton, ButtonGroup, Popover } from '@blueprintjs/core';
import { Icon } from 'components';

require('./actionButton.scss');

const propTypes = {
	buttons: PropTypes.arrayOf(
		PropTypes.shape({
			isWide: PropTypes.bool,
			isSkinny: PropTypes.bool,
			popoverProps: PropTypes.object,
		}),
	).isRequired,
	isSkewed: PropTypes.bool,
	isLarge: PropTypes.bool,
};

const defaultProps = {
	isSkewed: false,
	isLarge: false,
};

const ActionButton = function(props) {
	const { isLarge, isSkewed } = props;
	const buttons = props.buttons.map((buttonData) => {
		const key = `${buttonData.text}-${buttonData.icon}-${buttonData.href}`;
		const icon = buttonData.icon ? (
			<Icon icon={buttonData.icon} iconSize={props.isLarge ? 22 : 18} />
		) : (
			undefined
		);

		const { isWide, isSkinny, ...buttonProps } = buttonData;
		const buttonClass = classNames(isWide && 'wide', isSkinny && 'skinny', isLarge && 'large');
		const buttonComponent = buttonData.href ? (
			<AnchorButton key={key} className={buttonClass} {...buttonProps} icon={icon} />
		) : (
			<Button key={key} className={buttonClass} {...buttonProps} icon={icon} />
		);
		if (buttonData.popoverProps) {
			return (
				<Popover
					key={`popover-${key}`}
					{...buttonData.popoverProps}
					target={buttonComponent}
				/>
			);
		}
		return buttonComponent;
	});

	let groupClass = 'action-button-component';
	if (isSkewed) {
		groupClass += ' skewed';
	}

	return <ButtonGroup className={groupClass}>{buttons}</ButtonGroup>;
};

ActionButton.propTypes = propTypes;
ActionButton.defaultProps = defaultProps;
export default ActionButton;
