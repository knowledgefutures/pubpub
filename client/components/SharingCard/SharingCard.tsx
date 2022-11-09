import React from 'react';
import PropTypes from 'prop-types';
import { Classes } from '@blueprintjs/core';

require('./sharingCard.scss');

const propTypes = {
	content: PropTypes.node.isRequired,
	options: PropTypes.node,
	isAddCard: PropTypes.bool,
	isFlatCard: PropTypes.bool,
};

const defaultProps = {
	options: undefined,
	isAddCard: false,
	isFlatCard: false,
};

const SharingCard = function (props) {
	return (
		<div
			className={`sharing-card-component ${props.isAddCard ? 'add' : ''} ${
				props.isFlatCard ? `flat ${Classes.ELEVATION_0}` : Classes.ELEVATION_1
			}`}
		>
			<div className="content">{props.content}</div>
			{props.options && <div className="options">{props.options}</div>}
		</div>
	);
};

SharingCard.propTypes = propTypes;
SharingCard.defaultProps = defaultProps;
export default SharingCard;
