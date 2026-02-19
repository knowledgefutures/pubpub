import React, { useState } from 'react';

import { Button, Classes, Collapse } from '@blueprintjs/core';

interface WhyAmISeeingThisProps {
	children: React.ReactNode;
}

export const WhyAmISeeingThis = (props: WhyAmISeeingThisProps) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div>
			<Button
				icon="info-sign"
				onClick={() => setIsOpen(!isOpen)}
				title="Why am I seeing this?"
				intent="none"
				className={`${Classes.MINIMAL} ${Classes.SMALL} ${Classes.TEXT_SMALL}`}
			>
				Why am I seeing this?
			</Button>
			<Collapse isOpen={isOpen}>{props.children}</Collapse>
		</div>
	);
};
