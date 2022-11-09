import React from 'react';
import { Menu, MenuItem, NonIdealState, Tag } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { Pub, DefinitelyHas, Reviewer } from 'types';

require('./dashboardReviews.scss');

type Props = {
	pubsWithReviews: DefinitelyHas<Pub, 'reviews'>[];
};

const DashboardReviews = (props: Props) => {
	const { pubsWithReviews } = props;
	const { scopeData } = usePageContext();
	const { activeCollection, activeTargetType } = scopeData.elements;
	const renderReviewerByline = (reviewers: Reviewer[] | undefined) => {
		return reviewers
			? reviewers.map((reviewer) => {
					return <span key={reviewer.id}>{reviewer.name}</span>;
			  })
			: '';
	};
	return (
		<DashboardFrame
			className="dashboard-reviews-container"
			title="Reviews"
			details="Reviews allow members of your Community to request feedback on their Pubs and release them to the world."
		>
			{!pubsWithReviews.length && (
				<Menu className="list-content">
					<NonIdealState
						title={
							activeTargetType === 'pub'
								? 'This Pub has not been reviewed using PubPub'
								: 'No reviews here.'
						}
						icon="social-media"
					/>
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
								.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
								.map((review) => {
									const hasReviewers =
										review.reviewers && review.reviewers.length > 0;
									const reviewers = review.reviewers;
									const reviewUrl = getDashUrl({
										collectionSlug: activeCollection
											? activeCollection.slug
											: undefined,
										pubSlug: pub.slug,
										mode: 'reviews',
										subMode: String(review.number),
									});
									return (
										<MenuItem
											key={review.id}
											href={reviewUrl}
											text={
												<div className="list-row">
													<div className="number">
														R{review.number}: {review.title}
													</div>
													{hasReviewers && (
														<div className="note">
															by {renderReviewerByline(reviewers)}
															&nbsp;
														</div>
													)}
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
export default DashboardReviews;
