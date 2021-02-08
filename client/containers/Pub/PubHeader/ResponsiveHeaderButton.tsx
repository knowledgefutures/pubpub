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

const ResponsiveHeaderButton = React.forwardRef((props: Props, ref) => {
	const { labelPosition, outerLabel, showCaret = false, simpleLabel, ...sharedProps } = props;
	const largeOnlyProps = { outerLabel, showCaret };
	const smallOnlyProps = { labelPosition };

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

export default ResponsiveHeaderButton;
