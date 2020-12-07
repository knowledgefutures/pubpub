import React from 'react';

import { useViewport } from 'client/utils/useViewport';

import { mobileViewportCutoff } from './constants';
import LargeHeaderButton from './LargeHeaderButton';
import SmallHeaderButton from './SmallHeaderButton';

type Props = {
	simpleLabel?: React.ReactNode;
	showCaret?: boolean;
	outerLabel?: any;
	labelPosition?: string;
};

const defaultProps = {
	simpleLabel: undefined,
	showCaret: false,
	outerLabel: undefined,
	labelPosition: undefined,
};

const ResponsiveHeaderButton = React.forwardRef<any, Props>((props, ref) => {
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
				outerLabel={outerLabel}
				ref={ref}
			/>
		);
	}
	// @ts-expect-error ts-migrate(2322) FIXME: Type 'ReactNode' is not assignable to type 'string... Remove this comment to see the full error message
	return <SmallHeaderButton {...sharedProps} {...smallOnlyProps} label={simpleLabel} ref={ref} />;
});
ResponsiveHeaderButton.defaultProps = defaultProps;
export default ResponsiveHeaderButton;
