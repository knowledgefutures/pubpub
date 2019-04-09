import React from 'react';
import PropTypes from 'prop-types';
import { Button, AnchorButton } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';

require('./pubHeaderActionButton.scss');

const propTypes = {
	buttonProps: PropTypes.object.isRequired,
	isSkewed: PropTypes.bool,
	isWide: PropTypes.bool,
	isSkinny: PropTypes.bool,
};

const defaultProps = {
	isSkewed: false,
	isWide: false,
	isSkinny: false,
};

const ActionButton = function(props) {
	let buttonClass = 'pub-header-action-button-component';
	if (props.isSkewed) {
		buttonClass += ' skewed';
	}
	if (props.isWide) {
		buttonClass += ' wide';
	}
	if (props.isSkinny) {
		buttonClass += ' skinny';
	}

	const icon = props.buttonProps.icon ? (
		<Icon icon={props.buttonProps.icon} iconSize={25} />
	) : (
		undefined
	);

	if (props.buttonProps.href) {
		return <AnchorButton className={buttonClass} {...props.buttonProps} icon={icon} />;
	}
	return <Button className={buttonClass} {...props.buttonProps} icon={icon} />;
};

ActionButton.propTypes = propTypes;
ActionButton.defaultProps = defaultProps;
export default ActionButton;
