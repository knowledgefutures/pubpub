import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

require('./pubHeaderBackground.scss');

const propTypes = {
	children: PropTypes.node,
	className: PropTypes.string,
	pubData: PropTypes.shape({}).isRequired,
};

const defaultProps = {
	className: '',
	children: null,
};

const PubHeaderBackground = React.forwardRef((props, ref) => {
	const { children, className, pubData } = props;
	return (
		<div className={classNames('pub-header-background-component', className)} ref={ref}>
			{children}
		</div>
	);
});

PubHeaderBackground.propTypes = propTypes;
PubHeaderBackground.defaultProps = defaultProps;
export default PubHeaderBackground;
