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
		return [
			...childrenArr.slice(0, shownItemsLimit),
			<TimelineItem
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				key="__timeline-condenser-expand-element__"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'true' is not assignable to type 'never'.
				hollow
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				icon="expand-all"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
				title={<i>{childrenArr.length - shownItemsLimit} more hidden</i>}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
				controls={
					<Button outlined onClick={() => setIsExpanded(true)} {...restProps}>
						Show all
					</Button>
				}
			/>,
		];
	}
	return children;
};
export default TimelineCondenser;
