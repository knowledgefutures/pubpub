import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

require('./tab-to-show.scss');

const propTypes = {
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
	holdOpen: PropTypes.bool,
	onFocus: PropTypes.func,
	tagName: PropTypes.string,
};

const defaultProps = {
	className: '',
	holdOpen: false,
	tagName: 'a',
	onFocus: () => {},
};

const TabToShow = React.forwardRef((props, ref) => {
	const { children, className, holdOpen, onFocus, tagName, ...restProps } = props;
	return React.createElement(
		tagName,
		{
			...restProps,
			ref: ref,
			tabIndex: 0,
			onFocus: onFocus,
			className: classNames(className, 'tab-to-show-component', holdOpen && 'hold-open'),
		},
		children,
	);
});

TabToShow.propTypes = propTypes;
TabToShow.defaultProps = defaultProps;
export default TabToShow;
