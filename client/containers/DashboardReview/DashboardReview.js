import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tag } from '@blueprintjs/core';
import TimeAgo from 'react-timeago';
import { DashboardFrame, Thread, ThreadInput } from 'components';
// import { usePageContext } from 'utils/hooks';
import ReviewEvent from 'containers/Pub/PubReview/ReviewEvent';

require('./dashboardReview.scss');

const propTypes = {
	reviewData: PropTypes.object.isRequired,
};

const DashboardReview = (props) => {
	const [localReviewData, setLocalReviewData] = useState(props.reviewData);
	const { author, status, thread, releaseRequested } = localReviewData;
	const events = [...thread.comments, ...thread.events];
	return (
		<DashboardFrame
			className="dashboard-review-container"
			title={
				<span>
					Reviews: {localReviewData.title}
					<span className="number">(R{localReviewData.number})</span>
				</span>
			}
			details={
				<React.Fragment>
					<Tag className={`status-tag ${status}`} minimal={true} large={true}>
						{status}
					</Tag>
					<span>
						<a href={`/user/${author.slug}`}>{author.fullName}</a> created this review{' '}
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
								return `${value} ${newUnit} ${suffix}`;
							}}
							date={localReviewData.createdAt}
						/>
					</span>
				</React.Fragment>
			}
		>
			<Thread threadData={thread} />
			<ThreadInput threadData={thread} />
			{/* releaseRequested && <Banner />}
			<ThreadOptions /> */}
			{events
				.sort((foo, bar) => {
					if (foo.createdAt > bar.createdAt) {
						return 1;
					}
					if (foo.createdAt < bar.createdAt) {
						return -1;
					}
					return 0;
				})
				.map((event) => {
					return <ReviewEvent key={event.id} eventData={event} />;
				})}
		</DashboardFrame>
	);
};

DashboardReview.propTypes = propTypes;
export default DashboardReview;
