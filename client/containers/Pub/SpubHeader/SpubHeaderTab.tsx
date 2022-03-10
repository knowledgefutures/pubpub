import React, { useRef, useState, useEffect } from 'react';

import { useViewport } from 'client/utils/useViewport';
import { GridWrapper } from 'components';

require('./spubHeaderTab.scss');

type Props = {
	children: React.ReactNode;
	expandToFold?: boolean;
};

const SpubHeaderTab = (props: Props) => {
	const elementRef = useRef<HTMLDivElement>(null);
	const [minHeight, setMinHeight] = useState(0);
	const { viewportHeight } = useViewport();
	useEffect(() => {
		if (elementRef.current) {
			setMinHeight(
				(viewportHeight || 0) -
					elementRef.current.getBoundingClientRect().top -
					window.scrollY,
			);
		}
	}, [viewportHeight]);
	return (
		<GridWrapper containerClassName="spub-header-tab-component">
			<div ref={elementRef} style={{ ...(props.expandToFold && { minHeight }) }}>
				{props.children}
			</div>
		</GridWrapper>
	);
};

export default SpubHeaderTab;
