import React from 'react';

import { usePopoverState, PopoverDisclosure, Popover, PopoverState } from 'reakit';
import { Card } from '@blueprintjs/core';

import { adaptDisclosureElementForBlueprintButton } from './blueprintAdapter';

type Props = {
	'aria-label': string;
	className?: string;
	children: React.ReactElement;
	component: () => React.ReactNode;
	placement?: PopoverState['placement'];
	gutter?: number;
};

const PopoverButton = (props: Props) => {
	const {
		component,
		'aria-label': ariaLabel,
		children,
		className,
		placement = 'bottom-end',
		gutter = 5,
	} = props;
	const popover = usePopoverState({ unstable_fixed: false, placement, gutter });
	return (
		<>
			<PopoverDisclosure {...popover} {...children.props}>
				{(disclosureProps) =>
					adaptDisclosureElementForBlueprintButton(
						children,
						disclosureProps,
						popover.visible,
					)
				}
			</PopoverDisclosure>
			<Popover
				aria-label={ariaLabel}
				className={className}
				unstable_portal={true}
				tabIndex={0}
				{...popover}
			>
				<Card elevation={2}>{component()}</Card>
			</Popover>
		</>
	);
};
export default PopoverButton;
