import React from 'react';
import PropTypes from 'prop-types';

import { useViewport } from 'utils/useViewport';

import { mobileViewportCutoff } from './constants';
import LargeHeaderButton from './LargeHeaderButton';
import SmallHeaderButton from './SmallHeaderButton';

const propTypes = {
	simpleLabel: PropTypes.node,
	showCaret: PropTypes.bool,
	outerLabel: PropTypes.any,
};

const defaultProps = {
	simpleLabel: undefined,
	showCaret: false,
	outerLabel: undefined,
};

const ResponsiveHeaderButton = React.forwardRef((props, ref) => {
	const { outerLabel, showCaret, simpleLabel, ...sharedProps } = props;
	const largeOnlyProps = { outerLabel: outerLabel, showCaret: showCaret };

	const { viewportWidth } = useViewport();

	if (viewportWidth === null) {
		return null;
	}
	if (viewportWidth > mobileViewportCutoff) {
		return (
			<LargeHeaderButton
				{...sharedProps}
				{...largeOnlyProps}
				outerLabel={outerLabel}
				ref={ref}
			/>
		);
	}
	return <SmallHeaderButton {...sharedProps} label={simpleLabel} ref={ref} />;
});

ResponsiveHeaderButton.propTypes = propTypes;
ResponsiveHeaderButton.defaultProps = defaultProps;
export default ResponsiveHeaderButton;
