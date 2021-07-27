import React from 'react';
import {
	usePopoverState,
	Popover as RkPopover,
	PopoverDisclosure as RkPopoverDisclosure,
	PopoverInitialState,
} from 'reakit';

import { adaptDisclosureElementForBlueprintButton } from './blueprintAdapter';

type Props = {
	'aria-label': string;
	className?: string;
	children: React.ReactElement;
	content: React.ReactNode;
	placement?: PopoverInitialState['placement'];
	preventBodyScroll?: boolean;
	gutter?: number;
	lazy?: boolean;
	unstable_fixed?: boolean;
};

const Popover = (props: Props) => {
	const {
		'aria-label': ariaLabel,
		children,
		className,
		content,
		placement = 'bottom-start',
		preventBodyScroll = true,
		gutter = 5,
		lazy = true,
		unstable_fixed = false,
	} = props;
	const popover = usePopoverState({ placement, gutter, unstable_fixed });
	return (
		<>
			<RkPopoverDisclosure {...popover} {...children.props}>
				{(disclosureProps) =>
					adaptDisclosureElementForBlueprintButton(
						children,
						disclosureProps,
						popover.visible,
					)
				}
			</RkPopoverDisclosure>
			<RkPopover
				aria-label={ariaLabel}
				className={className}
				modal
				preventBodyScroll={preventBodyScroll}
				style={{ zIndex: 20 }}
				{...popover}
			>
				{(!lazy || popover.visible) && content}
			</RkPopover>
		</>
	);
};
export default Popover;
