import React from 'react';
import PropTypes from 'prop-types';

import { useViewport } from 'client/utils/useViewport';

import { mobileViewportCutoff } from './constants';
import LargeHeaderButton from './LargeHeaderButton';
import SmallHeaderButton from './SmallHeaderButton';

const propTypes = {
	simpleLabel: PropTypes.node,
	showCaret: PropTypes.bool,
	outerLabel: PropTypes.any,
	labelPosition: PropTypes.string,
};

const defaultProps = {
	simpleLabel: undefined,
	showCaret: false,
	outerLabel: undefined,
	labelPosition: undefined,
};

const ResponsiveHeaderButton = React.forwardRef((props, ref) => {
	const { labelPosition, outerLabel, showCaret, simpleLabel, ...sharedProps } = props;
	const largeOnlyProps = { outerLabel: outerLabel, showCaret: showCaret };
	const smallOnlyProps = { labelPosition: labelPosition };

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
	return <SmallHeaderButton {...sharedProps} {...smallOnlyProps} label={simpleLabel} ref={ref} />;
});

ResponsiveHeaderButton.propTypes = propTypes;
ResponsiveHeaderButton.defaultProps = defaultProps;
export default ResponsiveHeaderButton;
