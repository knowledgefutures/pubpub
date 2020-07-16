import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
	count: PropTypes.number.isRequired,
	index: PropTypes.number.isRequired,
};

const PubEdgeListingCounter = (props) => {
	const { index, count } = props;

	return (
		<span className="pub-edge-listing-counter-component">
			{count === 0 ? 0 : index + 1} of {count}
		</span>
	);
};

PubEdgeListingCounter.propTypes = propTypes;
export default PubEdgeListingCounter;
