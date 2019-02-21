import React from 'react';
import PropTypes from 'prop-types';

require('./pubOptionsSharingCard.scss');

const propTypes = {
	content: PropTypes.object.isRequired,
	options: PropTypes.object,
	isAddCard: PropTypes.bool,
	isFlatCard: PropTypes.bool,
};

const defaultProps = {
	options: undefined,
	isAddCard: false,
	isFlatCard: false,
};

const PubOptionsSharingCard = function(props) {
	return (
		<div
			className={`pub-options-sharing-card-component ${props.isAddCard ? 'add' : ''} ${
				props.isFlatCard ? 'flat bp3-elevation-0' : 'bp3-elevation-1'
			}`}
		>
			<div className="content">{props.content}</div>
			{props.options && <div className="options">{props.options}</div>}
		</div>
	);
};

PubOptionsSharingCard.propTypes = propTypes;
PubOptionsSharingCard.defaultProps = defaultProps;
export default PubOptionsSharingCard;
