import React from 'react';
import TimeAgo from 'react-timeago';

import { Avatar, Icon } from 'components';
import { usePageContext } from 'utils/hooks';
import { timeAgoBaseProps } from 'utils/dates';

require('./threadEvent.scss');

type Props = {
	eventData: any;
};

const ThreadEvent = (props: Props) => {
	const { type, data, user, createdAt } = props.eventData;
	const { communityData } = usePageContext();
	const { accentColorDark } = communityData;
	const time = <TimeAgo {...timeAgoBaseProps} date={createdAt} />;
	const icons = {
		created: 'clean',
		completed: 'tick',
		closed: 'disable',
		released: 'document-open',
	};
	return (
		<div className="thread-event-component">
			<style>{`.status-block.released { background: ${accentColorDark}`}</style>
			<Icon
				className={`status-block ${data.statusChange}`}
				iconSize={14}
				icon={icons[data.statusChange]}
				color="#fff"
			/>
			<Avatar width={18} initials={user.initials} avatar={user.avatar} />
			<div>
				<a className="hoverline" href={`/user/${user.slug}`}>
					{user.fullName}
				</a>
				{type === 'status' && data.statusChange === 'created' && (
					<span> created this review {time}</span>
				)}
				{type === 'status' && data.statusChange === 'closed' && (
					<span> closed this review {time}</span>
				)}
				{type === 'status' && data.statusChange === 'completed' && (
					<span> marked this review complete {time}</span>
				)}
				{type === 'status' && data.statusChange === 'released' && (
					<span>
						{' '}
						created a{' '}
						<a
							className="hoverline"
							href={`/pub/${data.pubSlug}/release/${data.releaseNumber}`}
						>
							<b>Release</b>
						</a>{' '}
						from this review {time}
					</span>
				)}
			</div>
		</div>
	);
};
export default ThreadEvent;
