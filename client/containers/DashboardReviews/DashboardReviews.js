import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, NonIdealState, Tag } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import { DashboardFrame } from 'components';
// import { usePageContext } from 'utils/hooks';

require('./dashboardReviews.scss');

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const DashboardReviews = (props) => {
	const { overviewData } = props;
	// const { scopeData } = usePageContext();
	// const pubSlug = scopeData.elements.activePub.slug;
	const allReviews = overviewData.pubs.reduce((prev, curr) => {
		return [...prev, ...curr.reviews];
	}, []);
	const pubsById = {};
	overviewData.pubs.forEach((pub) => {
		pubsById[pub.id] = pub;
	});
	// console.log(allReviews);
	return (
		<DashboardFrame className="dashboard-reviews-container" title="Reviews">
			<Menu className="list-content">
				{!allReviews.length && <NonIdealState title="No Reviews Yet" icon="social-media" />}
				{allReviews
					.sort((foo, bar) => {
						if (foo.createdAt < bar.createdAt) {
							return 1;
						}
						if (foo.createdAt > bar.createdAt) {
							return -1;
						}
						return 0;
					})
					.map((review) => {
						return (
							<MenuItem
								href={`/dash/pub/${pubsById[review.pubId].slug}/reviews/${
									review.number
								}`}
								text={
									<div className="list-row">
										<div className="number">
											R{review.number}[{pubsById[review.pubId].title}]
										</div>
										<div className="title">
											{dateFormat(review.createdAt, 'mmm dd, yyyy - HH:MM')}
										</div>
										<div className="note">
											<Tag minimal className={review.status}>
												{review.status}
											</Tag>
										</div>
									</div>
								}
							/>
						);
					})}
			</Menu>
		</DashboardFrame>
	);
};

DashboardReviews.propTypes = propTypes;
export default DashboardReviews;
