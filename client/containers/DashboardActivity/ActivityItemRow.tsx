import React from 'react';

import { formatDate } from 'utils/dates';
import { Icon } from 'client/components';
import { RenderedActivityItem } from 'client/utils/activity/types';

require('./activityItemRow.scss');

type Props = {
	item: RenderedActivityItem;
};

const ActivityItemRow = (props: Props) => {
	const {
		item: { message, excerpt, timestamp, icon },
	} = props;
	return (
		<div className="activity-item-row-component">
			<div className="timestamp">{formatDate(timestamp, { includeTime: true })}</div>
			<div className="icon">
				<Icon icon={icon} />
			</div>
			<div className="message">{message}</div>
			{excerpt && <div className="excerpt">{excerpt}</div>}
		</div>
	);
};

export default ActivityItemRow;
