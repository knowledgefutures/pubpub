import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
	containerClassName: PropTypes.string,
	columnClassName: PropTypes.string,
	children: PropTypes.node,
};

const defaultProps = {
	containerClassName: '',
	columnClassName: '',
	children: null,
};

const GridWrapper = function(props) {
	return (
		<div className={`container ${props.containerClassName}`}>
			<div className="row">
				<div className={`col-12 ${props.columnClassName}`}>{props.children}</div>
			</div>
		</div>
	);
};

GridWrapper.defaultProps = defaultProps;
GridWrapper.propTypes = propTypes;
export default GridWrapper;
