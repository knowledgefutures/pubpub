import React from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import { Avatar } from 'components';
import Editor from 'components/Editor';

require('./reviewEvent.scss');

const propTypes = {
	eventData: PropTypes.object.isRequired,
};

const ReviewEvent = (props) => {
	const { eventData } = props;

	const time = (
		<TimeAgo
			minPeriod={60}
			formatter={(value, unit, suffix) => {
				if (unit === 'second') {
					return 'just now';
				}
				let newUnit = unit;
				if (value > 1) {
					newUnit += 's';
				}
				return ` ${value} ${newUnit} ${suffix}`;
			}}
			date={eventData.createdAt}
		/>
	);
	const user = eventData.user || eventData.author;
	return (
		<div className="review-event-component">
			<Avatar width={30} initials={user.initials} avatar={user.avatar} />
			<div className="event-content">
				<a className="user" href={`/user/${user.slug}`}>
					{user.fullName}
				</a>
				{eventData.type === 'status' && eventData.data.statusChange === 'created' && (
					<span> created this review {time}</span>
				)}
				{eventData.type === 'status' && eventData.data.statusChange === 'closed' && (
					<span> closed this review {time}</span>
				)}
				{eventData.type === 'status' && eventData.data.statusChange === 'completed' && (
					<span> marked this review complete {time}</span>
				)}
				{eventData.content && <span> commented {time}</span>}
				{eventData.content && (
					<div className="comment-wrapper">
						<Editor initialContent={eventData.content} isReadOnly={true} />
					</div>
				)}
			</div>
		</div>
	);
};

ReviewEvent.propTypes = propTypes;
export default ReviewEvent;
