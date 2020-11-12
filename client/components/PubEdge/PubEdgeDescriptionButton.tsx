import React from 'react';

require('./pubEdgeDescriptionButton.scss');

export type PubEdgeDescriptionButtonProps = {
	open: boolean;
	targetId: string;
	onToggle: (event: React.MouseEvent | React.KeyboardEvent) => unknown;
};

const PubEdgeDescriptionButton = (props: PubEdgeDescriptionButtonProps) => {
	return (
		<span
			onClick={props.onToggle}
			onKeyDown={props.onToggle}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'number | ... Remove this comment to see the full error message
			tabIndex="0"
			className="pub-edge-description-button"
			role="button"
			aria-controls={props.targetId}
			aria-expanded={props.open}
		>
			{props.open ? 'Hide Description' : 'Show Description'}
		</span>
	);
};

export default PubEdgeDescriptionButton;
