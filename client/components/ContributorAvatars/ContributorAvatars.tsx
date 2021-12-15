import React from 'react';
import { Popover } from '@blueprintjs/core';

import { AttributionWithUser } from 'types';
import ContributorsList from '../ContributorsList/ContributorsList';
import Avatars from '../Avatars/Avatars';

require('./contributorAvatars.scss');

type Props = {
	attributions: AttributionWithUser[];
	className?: string;
	truncateAt?: number;
	hasPopover?: boolean;
};

const ContributorAvatars = (props: Props) => {
	const { attributions, className, truncateAt, hasPopover = true } = props;

	if (attributions.length === 0) {
		return null;
	}

	const content = (
		<Avatars
			users={attributions.map((a) => a.user)}
			className={className}
			truncateAt={truncateAt}
		/>
	);

	const renderPopoverContent = () => {
		return (
			<div className="contributor-avatars-component_list-container">
				<ContributorsList attributions={props.attributions} />
			</div>
		);
	};

	if (hasPopover) {
		return (
			<Popover
				minimal
				interactionKind="hover"
				content={renderPopoverContent()}
				position="bottom-left"
				popoverClassName="contributor-avatars-component_popover"
			>
				{content}
			</Popover>
		);
	}

	return content;
};

export default ContributorAvatars;
