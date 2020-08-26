import React from 'react';
import { Button } from 'reakit/Button';

import { Icon } from 'components';

require('./expandButton.scss');

type Props = {
	accentColor: string;
	isExpanded: boolean;
	onClick: (...args: any[]) => any;
};

const ExpandButton = (props: Props) => {
	const { accentColor, isExpanded, onClick } = props;

	return (
		<Button as="div" className="expand-button-component" onClick={onClick} aria-hidden={true}>
			<div className="relative-container">
				<div className="icon-container" style={{ color: accentColor }}>
					<Icon icon={isExpanded ? 'chevron-up' : 'chevron-down'} />
				</div>
			</div>
		</Button>
	);
};
export default ExpandButton;
