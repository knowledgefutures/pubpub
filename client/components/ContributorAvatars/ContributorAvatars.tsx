import React from 'react';
import classNames from 'classnames';

import { AttributionWithUser } from 'utils/types';
import { Popover } from '@blueprintjs/core';
import Avatar from '../Avatar/Avatar';
import ContributorsList from '../ContributorsList/ContributorsList';

require('./contributorAvatars.scss');

type Props = {
	attributions: AttributionWithUser[];
	className?: string;
	truncateAt?: number;
	hasPopover?: boolean;
};

const getTruncation = (attributions: AttributionWithUser[], truncateAt: number | undefined) => {
	if (truncateAt && attributions.length > truncateAt) {
		return {
			attributions: attributions.slice(0, truncateAt),
			overflow: attributions.length - truncateAt,
		};
	}
	return { attributions, overflow: null };
};

const ContributorAvatars = (props: Props) => {
	const { className, truncateAt, hasPopover = true } = props;
	const { attributions, overflow } = getTruncation(props.attributions, truncateAt);

	if (attributions.length === 0) {
		return null;
	}

	const content = (
		<div className={classNames('contributor-avatars-component', className)}>
			{attributions.map((attr, index) => (
				<Avatar
					initials={attr.user.initials}
					avatar={attr.user.avatar}
					key={attr.user.id}
					instanceNumber={index}
					width={22}
					borderWidth="2"
					borderColor="#eee"
					doesOverlap
				/>
			))}
			{overflow && <div className="overflow">+{overflow}</div>}
		</div>
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
