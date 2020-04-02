import React from 'react';
import PropTypes from 'prop-types';
// import { usePageContext } from 'utils/hooks';
import { Avatar } from 'components';
import TimeAgo from 'react-timeago';
import { timeAgoBaseProps } from 'utils';

require('./threadEvent.scss');

const propTypes = {
	eventData: PropTypes.object.isRequired,
};

const ThreadEvent = (props) => {
	const { type, data, user, createdAt } = props.eventData;
	const time = <TimeAgo {...timeAgoBaseProps} date={createdAt} />;
	return (
		<div className="thread-event-component">
			<Avatar width={24} intials={user.initials} avatar={user.avatar} />
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
		</div>
	);
};

ThreadEvent.propTypes = propTypes;
export default ThreadEvent;
