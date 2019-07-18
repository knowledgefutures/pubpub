import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, AnchorButton, ButtonGroup, Popover, Tooltip } from '@blueprintjs/core';
import { Icon } from 'components';

require('./actionButton.scss');

const buttonDataShape = PropTypes.shape({
	isWide: PropTypes.bool,
	isSkinny: PropTypes.bool,
	popoverProps: PropTypes.object,
	tooltipText: PropTypes.string,
});

const propTypes = {
	buttons: PropTypes.arrayOf(buttonDataShape).isRequired,
	isSkewed: PropTypes.bool,
	isLarge: PropTypes.bool,
};

const defaultProps = {
	isSkewed: false,
	isLarge: false,
};

const SubButton = (props) => {
	const { isLarge, buttonData } = props;
	const [isPopoverOpen, setPopoverOpen] = useState(false);
	const icon = buttonData.icon && (
		<Icon icon={buttonData.icon} iconSize={props.isLarge ? 22 : 18} />
	);

	const { isWide, isSkinny, ...buttonProps } = buttonData;
	const buttonClass = classNames(isWide && 'wide', isSkinny && 'skinny', isLarge && 'large');
	const buttonComponent = buttonData.href ? (
		<AnchorButton className={buttonClass} {...buttonProps} icon={icon} />
	) : (
		<Button className={buttonClass} {...buttonProps} icon={icon} />
	);
	const maybeWrapperButtonComponent =
		!isPopoverOpen && buttonData.tooltipText ? (
			<Tooltip content={buttonData.tooltipText}>{buttonComponent}</Tooltip>
		) : (
			buttonComponent
		);

	if (buttonData.popoverProps) {
		const { content, ...restProps } = buttonData.popoverProps;
		return (
			<Popover
				{...restProps}
				content={
					typeof content === 'function' ? content(() => setPopoverOpen(false)) : content
				}
				target={maybeWrapperButtonComponent}
				onInteraction={setPopoverOpen}
				isOpen={isPopoverOpen}
			/>
		);
	}
	return maybeWrapperButtonComponent;
};

SubButton.propTypes = {
	...propTypes,
	buttonData: buttonDataShape.isRequired,
};

const ActionButton = function(props) {
	const { buttons, isSkewed, isLarge } = props;

	return (
		<ButtonGroup
			className={classNames(
				'action-button-component',
				'themed-button-component',
				isSkewed && 'skewed',
			)}
		>
			{buttons.map((buttonData) => (
				<SubButton
					isLarge={isLarge}
					key={`${buttonData.text}-${buttonData.icon}-${buttonData.href}`}
					buttonData={buttonData}
				/>
			))}
		</ButtonGroup>
	);
};

ActionButton.propTypes = propTypes;
ActionButton.defaultProps = defaultProps;
export default ActionButton;
