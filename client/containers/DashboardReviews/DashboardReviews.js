import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, NonIdealState, Tag } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';

require('./dashboardReviews.scss');

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const DashboardReviews = (props) => {
	const { overviewData } = props;
	const { scopeData } = usePageContext();
	const { activeCollection, activeTargetType } = scopeData.elements;
	const pubsWithReviews = overviewData.pubs.filter((pub) => {
		if (activeTargetType === 'collection') {
			const pubInCollection = !!pub.collectionPubs.find((cp) => {
				return cp.collectionId === activeCollection.id;
			});
			if (!pubInCollection) {
				return false;
			}
		}
		return pub.reviews.length;
	});
	return (
		<DashboardFrame
			className="dashboard-reviews-container"
			title="Reviews"
			details="Reviews allow members of your Community to request feedback on their Pubs and release them to the world."
		>
			{!pubsWithReviews.length && (
				<Menu className="list-content">
					<NonIdealState title="No Reviews Yet" icon="social-media" />
				</Menu>
			)}
			{pubsWithReviews.map((pub) => {
				const pubUrl = getDashUrl({
					collectionSlug: activeCollection ? activeCollection.slug : undefined,
					pubSlug: pub.slug,
				});
				return (
					<React.Fragment key={pub.id}>
						{activeTargetType !== 'pub' && (
							<a className="pub-title" href={pubUrl}>
								{pub.title}
							</a>
						)}
						<Menu className="list-content">
							{pub.reviews
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
									const reviewUrl = getDashUrl({
										collectionSlug: activeCollection
											? activeCollection.slug
											: undefined,
										pubSlug: pub.slug,
										mode: 'reviews',
										subMode: review.number,
									});
									return (
										<MenuItem
											href={reviewUrl}
											text={
												<div className="list-row">
													<div className="number">
														R{review.number}: {review.title}
													</div>
													<div className="title">
														{dateFormat(
															review.createdAt,
															'mmm dd, yyyy - HH:MM',
														)}
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
					</React.Fragment>
				);
			})}
		</DashboardFrame>
	);
};

DashboardReviews.propTypes = propTypes;
export default DashboardReviews;
