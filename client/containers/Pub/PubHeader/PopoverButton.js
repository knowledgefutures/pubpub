import React from 'react';
import PropTypes from 'prop-types';

import { usePopoverState, PopoverDisclosure, Popover } from 'reakit';
import { Card } from '@blueprintjs/core';

const propTypes = {
	'aria-label': PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
	component: PropTypes.func.isRequired,
};

const PopoverButton = (props) => {
	const { component: Component, 'aria-label': ariaLabel, children, ...restProps } = props;
	const popover = usePopoverState({ unstable_fixed: true, placement: 'bottom-end', gutter: 5 });
	return (
		<>
			<PopoverDisclosure {...popover} {...children.props}>
				{(disclosureProps) => {
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

PopoverButton.propTypes = propTypes;
export default PopoverButton;
