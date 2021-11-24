import React from 'react';

import { RenderedActivityItem } from 'client/utils/activity/types';

import ActivityItemRow from './ActivityItemRow';

require('./activityItemGroup.scss');

type Props = {
	items: RenderedActivityItem[];
	label: React.ReactNode;
};

const ActivityItemGroup = (props: Props) => {
	const { items, label } = props;
	return (
		<div className="activity-item-group-component">
			<div className="heading">
				<div className="label">{label}</div>
			</div>
			{items.map((item) => (
				<ActivityItemRow item={item} key={item.id} />
			))}
		</div>
	);
};

export default ActivityItemGroup;
