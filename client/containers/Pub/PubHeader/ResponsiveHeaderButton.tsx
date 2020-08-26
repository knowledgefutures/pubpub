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
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'labelPosition' does not exist on type '{... Remove this comment to see the full error message
	const { labelPosition, outerLabel, showCaret, simpleLabel, ...sharedProps } = props;
	const largeOnlyProps = { outerLabel: outerLabel, showCaret: showCaret };
	const smallOnlyProps = { labelPosition: labelPosition };

	const { viewportWidth } = useViewport();

	if (viewportWidth === null) {
		return null;
	}
	// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
	if (viewportWidth > mobileViewportCutoff) {
		return (
			<LargeHeaderButton
				{...sharedProps}
				{...largeOnlyProps}
				// @ts-expect-error ts-migrate(2322) FIXME: Property 'outerLabel' does not exist on type 'Intr... Remove this comment to see the full error message
				outerLabel={outerLabel}
				ref={ref}
			/>
		);
	}
	// @ts-expect-error ts-migrate(2322) FIXME: Property 'label' does not exist on type 'Intrinsic... Remove this comment to see the full error message
	return <SmallHeaderButton {...sharedProps} {...smallOnlyProps} label={simpleLabel} ref={ref} />;
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ simpleLabel: Requireable<ReactNodeLike>; s... Remove this comment to see the full error message
ResponsiveHeaderButton.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ simpleLabel: undefined; showCaret: boolean... Remove this comment to see the full error message
ResponsiveHeaderButton.defaultProps = defaultProps;
export default ResponsiveHeaderButton;
