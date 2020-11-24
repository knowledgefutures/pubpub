import React from 'react';

import { usePopoverState, PopoverDisclosure, Popover } from 'reakit';
import { Card } from '@blueprintjs/core';

type Props = {
	'aria-label': string;
	className?: string;
	children: React.ReactElement;
	component: React.ComponentType<any>;
	[key: string]: any;
};

const PopoverButton = (props: Props) => {
	const {
		component: Component,
		'aria-label': ariaLabel,
		children,
		className,
		...restProps
	} = props;
	const popover = usePopoverState({ unstable_fixed: false, placement: 'bottom-end', gutter: 5 });
	return (
		<>
			<PopoverDisclosure {...popover} {...children.props}>
				{(disclosureProps) => React.cloneElement(children, disclosureProps)}
			</PopoverDisclosure>
			<Popover
				aria-label={ariaLabel}
				className={className}
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
