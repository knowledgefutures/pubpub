import React from 'react';
import PropTypes from 'prop-types';
import { Button, AnchorButton, ButtonGroup, Popover } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';

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
	const buttons = props.buttons.map((buttonData) => {
		const icon = buttonData.icon ? (
			<Icon icon={buttonData.icon} iconSize={props.isLarge ? 22 : 18} />
		) : (
			undefined
		);

		let buttonClass = '';
		if (buttonData.isWide) {
			buttonClass += ' wide';
		}
		if (buttonData.isSkinny) {
			buttonClass += ' skinny';
		}
		if (props.isLarge) {
			buttonClass += ' large';
		}

		const buttonComponent = buttonData.href ? (
			<AnchorButton className={buttonClass} {...buttonData} icon={icon} />
		) : (
			<Button className={buttonClass} {...buttonData} icon={icon} />
		);
		if (buttonData.popoverProps) {
			return <Popover {...buttonData.popoverProps} target={buttonComponent} />;
		}
		return buttonComponent;
	});

	let groupClass = 'action-button-component';
	if (props.isSkewed) {
		groupClass += ' skewed';
	}

	return <ButtonGroup className={groupClass}>{buttons}</ButtonGroup>;
};

ActionButton.propTypes = propTypes;
ActionButton.defaultProps = defaultProps;
export default ActionButton;
