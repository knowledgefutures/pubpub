import React from 'react';

import { useViewport } from 'client/utils/useViewport';

import { mobileViewportCutoff } from './constants';
import LargeHeaderButton from './LargeHeaderButton';
import SmallHeaderButton, { Props as SmallHeaderButtonProps } from './SmallHeaderButton';

type Props = SmallHeaderButtonProps & {
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

	if (viewportWidth === null || viewportWidth > mobileViewportCutoff) {
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

export default ResponsiveHeaderButton;
