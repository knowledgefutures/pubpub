import React, { useRef, useState, useLayoutEffect } from 'react';
import classNames from 'classnames';

import { GridWrapper } from 'components';
import { useViewport } from 'client/utils/useViewport';

require('./spubHeaderTab.scss');

type Props = {
	children: React.ReactNode;
	className?: string;
	expandToFold?: boolean;
};

const SpubHeaderTab = (props: Props) => {
	const { children, className, expandToFold } = props;
	const elementRef = useRef<HTMLDivElement>(null);
	const [minHeight, setMinHeight] = useState(0);
	const { viewportHeight } = useViewport();

	useLayoutEffect(() => {
		if (elementRef.current) {
			setMinHeight(
				(viewportHeight || 0) -
					elementRef.current.getBoundingClientRect().top -
					window.scrollY,
			);
		}
	}, [viewportHeight]);

	return (
		<GridWrapper containerClassName={classNames('spub-header-tab-component', className)}>
			<div style={{ ...(expandToFold && { minHeight }) }} ref={elementRef}>
				{children}
			</div>
		</GridWrapper>
	);
};

export default SpubHeaderTab;
