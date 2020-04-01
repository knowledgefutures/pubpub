import React from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
// import { AnchorButton } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { Avatar } from 'components';
import Editor from '@pubpub/editor';
// import { usePageContext } from 'utils/hooks';

require('./reviewEvent.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	eventData: PropTypes.object.isRequired,
};

const ReviewEvent = (props) => {
	const { eventData } = props;
	// const { locationData } = usePageContext();
	// const activeReview = pubData.reviews.find((review) => {
	// 	return review.shortId === Number(locationData.params.reviewShortId);
	// });
	// const sourceBranch = pubData.branches.find((branch) => {
	// 	return branch.id === activeReview.sourceBranchId;
	// });
	// const destinationBranch = pubData.branches.find((branch) => {
	// 	return branch.id === activeReview.destinationBranchId;
	// });

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
				{/* eventData.type === 'status' && eventData.data.statusChange === 'merged' && (
					<span>
						{' '}
						merged #{sourceBranch.title} into #{destinationBranch.title} {time}
					</span>
				)}
				{eventData.type === 'status' && eventData.data.statusChange === 'merged' && (
					<div>
						<AnchorButton
							href={`/pub/${pubData.slug}/branch/${destinationBranch.shortId}`}
							text={`Go to #${destinationBranch.title}`}
							small={true}
						/>
					</div>
				) */}
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
