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
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'className' does not exist on type '{ chi... Remove this comment to see the full error message
	const { children, className, holdOpen, onFocus, tagName, ...restProps } = props;
	return React.createElement(
		tagName,
		{
			...restProps,
			ref,
			tabIndex: 0,
			onFocus,
			className: classNames(className, 'tab-to-show-component', holdOpen && 'hold-open'),
		},
		children,
	);
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ children: Validator<string | number | bool... Remove this comment to see the full error message
TabToShow.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ className: string; holdOpen: boolean; tagN... Remove this comment to see the full error message
TabToShow.defaultProps = defaultProps;
export default TabToShow;
