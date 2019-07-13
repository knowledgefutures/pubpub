import React from 'react';
import TimeAgo from 'react-timeago';
import { Tag, Intent, NonIdealState } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper, Icon } from 'components';

require('./pubReviews.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubReviews = (props) => {
	const { pubData } = props;

	return (
		<div className="pub-reviews-component">
			<GridWrapper containerClassName="pub">
				<h2>Reviews</h2>
				{!pubData.reviews.length && (
					<NonIdealState icon="issue" title="No Existing Reviews" />
				)}
				{pubData.reviews
					.sort((foo, bar) => {
						return bar.shortId - foo.shortId;
					})
					.map((review) => {
						const sourceBranch = pubData.branches.find((branch) => {
							return branch.id === review.sourceBranchId;
						});
						const destinationBranch = pubData.branches.find((branch) => {
							return branch.id === review.destinationBranchId;
						});

						let statusIntent;
						if (review.isClosed && !review.isCompleted) {
							statusIntent = Intent.DANGER;
						}
						if (review.isCompleted) {
							statusIntent = Intent.SUCCESS;
						}
						if (review.mergeId) {
							statusIntent = Intent.SUCCESS;
						}
						return (
							<a
								key={review.id}
								className="review-row"
								href={`/pub/${pubData.slug}/reviews/${review.shortId}`}
							>
								<div className="short-id">{review.shortId}</div>

								<Tag minimal={true} className="branch-tag">
									#{sourceBranch.title}{' '}
									{destinationBranch.id && (
										<React.Fragment>
											<Icon
												icon="arrow-right"
												iconSize={12}
												className="merge-arrow"
											/>{' '}
											#
										</React.Fragment>
									)}
									{destinationBranch.title}
								</Tag>

								<div className="date">
									<span>Opened </span>
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
										date={review.createdAt}
									/>
								</div>

								<div>
									<Tag
										className="status-tag"
										minimal={true}
										large={true}
										intent={statusIntent}
									>
										{!review.isClosed && 'Open'}
										{review.isClosed && !review.isCompleted && 'Closed'}
										{review.isCompleted && !review.mergeId && 'Completed'}
										{review.mergeId && 'Merged'}
									</Tag>
								</div>
							</a>
						);
					})}
			</GridWrapper>
		</div>
	);
};

PubReviews.propTypes = propTypes;
export default PubReviews;
