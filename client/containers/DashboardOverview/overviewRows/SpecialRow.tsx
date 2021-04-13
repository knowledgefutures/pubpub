import React from 'react';
import classNames from 'classnames';

import { usePageContext } from 'utils/hooks';

require('./specialRow.scss');

type Props = {
	isDark?: boolean;
	children: React.ReactNode;
	className?: string;
};

const SpecialRow = React.forwardRef((props: Props, ref: any) => {
	const { isDark, children, className, ...restProps } = props;
	const {
		communityData: { accentColorDark },
	} = usePageContext();

	return (
		<div
			{...restProps}
			ref={ref}
			className={classNames('special-row-component', isDark && 'dark', className)}
			style={isDark ? { background: accentColorDark, color: 'white' } : {}}
		>
			<div className="inner">{children}</div>
		</div>
	);
});

export default SpecialRow;
