import React, { useState } from 'react';
import { Button } from '@blueprintjs/core';

import TimelineItem from './TimelineItem';

type Props = {
	children: React.ReactNode;
	shownItemsLimit: number;
};

export const TimelineCondenser = (props: Props) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const { children, shownItemsLimit, ...restProps } = props;
	const childrenArr = React.Children.toArray(children);
	if (childrenArr.length > shownItemsLimit && !isExpanded) {
		return (
			<>
				{[
					...childrenArr.slice(0, shownItemsLimit),
					<TimelineItem
						key="__timeline-condenser-expand-element__"
						hollow
						icon="expand-all"
						title={<i>{childrenArr.length - shownItemsLimit} more hidden</i>}
						controls={
							<Button outlined onClick={() => setIsExpanded(true)} {...restProps}>
								Show all
							</Button>
						}
					/>,
				]}
			</>
		);
	}
	return <>{children}</>;
};
export default TimelineCondenser;
