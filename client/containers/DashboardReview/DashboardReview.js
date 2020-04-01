import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tag } from '@blueprintjs/core';
import { DashboardFrame } from 'components';
// import { usePageContext } from 'utils/hooks';
import ReviewEvent from 'containers/Pub/PubReview/ReviewEvent';

require('./dashboardReview.scss');

const propTypes = {
	reviewData: PropTypes.object.isRequired,
};

const DashboardReview = (props) => {
	const [localReviewData, setLocalReviewData] = useState(props.reviewData);
	const { status, thread } = localReviewData;
	const events = [...thread.comments, ...thread.events];
	return (
		<DashboardFrame
			className="dashboard-review-container"
			title={`Reviews: ${localReviewData.number}`}
			controls={
				<Tag className={`status-tag ${status}`} minimal={true} large={true}>
					{status}
				</Tag>
			}
		>
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
