import React from 'react';

import { usePopoverState, PopoverDisclosure, Popover } from 'reakit';
import { Card } from '@blueprintjs/core';

type Props = {
	'aria-label': string;
	children: React.ReactNode;
	component: (...args: any[]) => any;
};

const PopoverButton = (props: Props) => {
	const { component: Component, 'aria-label': ariaLabel, children, ...restProps } = props;
	const popover = usePopoverState({ unstable_fixed: true, placement: 'bottom-end', gutter: 5 });
	return (
		<>
			{/* @ts-expect-error ts-migrate(2533) FIXME: Object is possibly 'null' or 'undefined'. */}
			<PopoverDisclosure {...popover} {...children.props}>
				{(disclosureProps) => {
					// @ts-expect-error ts-migrate(2769) FIXME: Type 'undefined' is not assignable to type 'ReactE... Remove this comment to see the full error message
					return React.cloneElement(children, disclosureProps);
				}}
			</PopoverDisclosure>
			<Popover
				aria-label={ariaLabel}
				className="pub-header-popover"
				unstable_portal={true}
				tabIndex={0}
				{...popover}
			>
				<Card elevation={2}>
					<Component {...restProps} />
				</Card>
			</Popover>
		</>
	);
};
export default PopoverButton;
