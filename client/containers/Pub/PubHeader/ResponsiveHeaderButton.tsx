import React from 'react';

import { MobileAware } from 'components';

import LargeHeaderButton from './LargeHeaderButton';
import SmallHeaderButton, { type Props as SmallHeaderButtonProps } from './SmallHeaderButton';

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

	return (
		<MobileAware
			ref={ref}
			desktop={(mobileAwareProps) => (
				<LargeHeaderButton
					{...sharedProps}
					{...largeOnlyProps}
					{...mobileAwareProps}
					outerLabel={outerLabel}
				/>
			)}
			mobile={(mobileAwareProps) => (
				<SmallHeaderButton
					{...sharedProps}
					{...smallOnlyProps}
					{...mobileAwareProps}
					label={simpleLabel}
				/>
			)}
		/>
	);
});

export default ResponsiveHeaderButton;
